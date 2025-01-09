import {InteractionContext, Schema} from "@cardano-ogmios/client";
import {LedgerStateQueryClient} from "@cardano-ogmios/client/dist/LedgerStateQuery";
import {
    Address,
    Assets,
    Credential,
    Datum,
    DatumHash,
    Delegation,
    EvalRedeemer, Native,
    OutRef,
    ProtocolParameters,
    Provider,
    RewardAddress,
    Script,
    Transaction,
    TxHash,
    Unit,
    UTxO
} from "@lucid-evolution/lucid";
import * as Ogmios from "@cardano-ogmios/client";
import {TransactionSubmissionClient} from "@cardano-ogmios/client/dist/TransactionSubmission";
import {parseFraction} from "../ultis/math_ultis";

export class OgmiosProvider implements Provider {
    context: InteractionContext;
    ledgerStateClient: LedgerStateQueryClient | undefined;
    transactionSubmissionClient: TransactionSubmissionClient | undefined;

    constructor(context: InteractionContext) {
        this.context = context;
        this.ledgerStateClient = undefined;
    }

    async getLedgerStateClient(): Promise<LedgerStateQueryClient> {
        if (this.ledgerStateClient) {
            return this.ledgerStateClient;
        }
        const ledgerStateClient = await Ogmios.createLedgerStateQueryClient(this.context);
        this.ledgerStateClient = ledgerStateClient;
        return this.ledgerStateClient;
    }

    async getTransactionSubmissionClient(): Promise<TransactionSubmissionClient> {
        if (this.transactionSubmissionClient) {
            return this.transactionSubmissionClient;
        }
        const transactionSubmissionClient = await Ogmios.createTransactionSubmissionClient(this.context);
        this.transactionSubmissionClient = transactionSubmissionClient;
        return this.transactionSubmissionClient;
    }

    toPriceMemory(ration: string): number {
        return parseFraction(ration);
    }

    toPriceStep(ration: string): number {
        return parseFraction(ration);
    }

    toProtocolParameters = (
        result: Schema.ProtocolParameters,
    ): ProtocolParameters => {
        if (!result.maxTransactionSize) {
            throw Error("maxTransactionSize not found");
        }
        if (!result.maxValueSize) {
            throw Error("maxValueSize not found");
        }
        if (!result.delegateRepresentativeDeposit) {
            throw Error("delegateRepresentativeDeposit not found");
        }
        if (!result.governanceActionDeposit) {
            throw Error("governanceActionDeposit not found");
        }
        if (!result.maxExecutionUnitsPerTransaction) {
            throw Error("maxExecutionUnitsPerTransaction not found");
        }
        if (!result.collateralPercentage) {
            throw Error("collateralPercentage not found");
        }
        if (!result.maxCollateralInputs) {
            throw Error("maxCollateralInputs not found");
        }
        if (!result.minFeeReferenceScripts) {
            throw Error("minFeeReferenceScripts not found");
        }
        if (!result.plutusCostModels) {
            throw Error("plutusCostModels not found");
        }

        if (!result.scriptExecutionPrices) {
            throw Error("scriptExecutionPrices not found");
        }

        return {
            minFeeA: result.minFeeCoefficient,
            minFeeB: Number(result.minFeeConstant.ada.lovelace),
            maxTxSize: result.maxTransactionSize.bytes,
            maxValSize: result.maxValueSize.bytes,
            keyDeposit: BigInt(result.stakeCredentialDeposit.ada.lovelace),
            poolDeposit: BigInt(result.stakePoolDeposit.ada.lovelace),
            drepDeposit: BigInt(result.delegateRepresentativeDeposit.ada.lovelace),
            govActionDeposit: BigInt(result.governanceActionDeposit.ada.lovelace),
            priceMem: this.toPriceMemory(result.scriptExecutionPrices.memory),
            priceStep: this.toPriceStep(result.scriptExecutionPrices.cpu),
            maxTxExMem: BigInt(result.maxExecutionUnitsPerTransaction.memory),
            maxTxExSteps: BigInt(result.maxExecutionUnitsPerTransaction.cpu),
            // NOTE: coinsPerUtxoByte is now called utxoCostPerByte:
            // https://github.com/IntersectMBO/cardano-node/pull/4141
            // Ogmios v6.x calls it minUtxoDepositCoefficient according to the following
            // documentation from its protocol parameters data model:
            // https://github.com/CardanoSolutions/ogmios/blob/master/architectural-decisions/accepted/017-api-version-6-major-rewrite.md#protocol-parameters
            coinsPerUtxoByte: BigInt(result.minUtxoDepositCoefficient),
            collateralPercentage: result.collateralPercentage,
            maxCollateralInputs: result.maxCollateralInputs,
            minFeeRefScriptCostPerByte: result.minFeeReferenceScripts.base,
            costModels: {
                PlutusV1: Object.fromEntries(
                    result.plutusCostModels["plutus:v1"].map((value, index) => [
                        String(index),
                        value,
                    ]),
                ),
                PlutusV2: Object.fromEntries(
                    result.plutusCostModels["plutus:v2"].map((value, index) => [
                        String(index),
                        value,
                    ]),
                ),
                PlutusV3: Object.fromEntries(
                    result.plutusCostModels["plutus:v3"].map((value, index) => [
                        String(index),
                        value,
                    ]),
                ),
            },
        };
    };

    toAsset(value: Schema.Value): Assets {
        const resultAssets: Assets = {
            "lovelace": BigInt(value.ada.lovelace)
        };

        for (const policyID in value) {
            if (policyID !== 'ada') {
                const assetAmounts = value[policyID];
                for (const assetName in assetAmounts) {
                    const amount = assetAmounts[assetName];
                    const assetId = policyID + assetName;
                    resultAssets[assetId] = BigInt(amount);
                }
            }
        }
        return resultAssets;
    }

    toScriptType(scriptType: "plutus:v1" | "plutus:v2" | "plutus:v3" | "native"): any {
        switch (scriptType) {
            case "plutus:v1":
                return "PlutusV1";
            case "plutus:v2":
                return "PlutusV2";
            case "plutus:v3":
                return "PlutusV3";
            case "native":
                return "Native";
            default:
                throw new Error("Scripts Type is not support")
        }
    }

    toScript(script?: Schema.Script): Script | undefined {
        if (!script) {
            return undefined;
        }

        if (!script?.cbor) {
            throw Error("Utxo script cbor not found");
        }

        return {
            type: this.toScriptType(script?.language),
            script: script?.cbor
        }
    }

    toUtxo(utxo: any): UTxO {
        return {
            txHash: utxo.transaction.id,
            outputIndex: utxo.index,
            address: utxo.address,
            assets: this.toAsset(utxo.value),
            datumHash: utxo.datumHash,
            datum: utxo.datum,
            scriptRef: this.toScript(utxo.script),
        };
    }

    toUtxos(utxos: Schema.Utxo): UTxO[] {
        const result: UTxO[] = [];
        for (const utxo of utxos) {
            result.push(this.toUtxo(utxo));
        }
        return result;
    }

    async getProtocolParameters(): Promise<ProtocolParameters> {
        const client = await this.getLedgerStateClient();
        const ogmiosProtocolParameters = await client.protocolParameters();
        const lucidProtocolParameters = this.toProtocolParameters(ogmiosProtocolParameters);
        return lucidProtocolParameters;
    }

    async getUtxos(addressOrCredential: Address | Credential): Promise<UTxO[]> {
        if (typeof addressOrCredential === "string") {
            const client = await this.getLedgerStateClient();
            const utxos = await client.utxo({addresses: [addressOrCredential]});
            const lucidUtxos = this.toUtxos(utxos);
            return lucidUtxos;
        } else {
            throw new Error("Method not implemented.");
        }
    }

    getUtxosWithUnit(addressOrCredential: Address | Credential, unit: Unit): Promise<UTxO[]> {
        throw new Error("Method not implemented.");
    }

    getUtxoByUnit(unit: Unit): Promise<UTxO> {
        throw new Error("Method not implemented.");
    }

    getUtxosByOutRef(outRefs: Array<OutRef>): Promise<UTxO[]> {
        throw new Error("Method not implemented.");
    }

    async getDelegation(rewardAddress: RewardAddress): Promise<Delegation> {
        const client = await this.getLedgerStateClient();
        const rewardAccountSummaries = await client.rewardAccountSummaries({keys: [rewardAddress]});
        const rewardAccountSummary = rewardAccountSummaries[0];
        if (!rewardAccountSummary) {
            return {
                poolId: null,
                rewards: BigInt(0),
            }
        }
        throw new Error("Method not implemented.");
    }

    getDatum(datumHash: DatumHash): Promise<Datum> {
        throw new Error("Method not implemented.");
    }

    awaitTx(txHash: TxHash, checkInterval?: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async submitTx(tx: Transaction): Promise<TxHash> {
        const client = await this.getTransactionSubmissionClient();
        const txHash = await client.submitTransaction(tx);
        return txHash;
    }

    evaluateTx(tx: Transaction, additionalUTxOs?: UTxO[]): Promise<EvalRedeemer[]> {
        throw new Error("Method not implemented.");
    }

}