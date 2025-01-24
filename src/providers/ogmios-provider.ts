import * as Ogmios from "@cardano-ogmios/client";
import {InteractionContext, Schema} from "@cardano-ogmios/client";
import {LedgerStateQueryClient} from "@cardano-ogmios/client/dist/LedgerStateQuery";
import {
    Address, applyDoubleCborEncoding,
    Assets,
    Credential,
    Datum,
    DatumHash,
    Delegation,
    EvalRedeemer,
    OutRef,
    ProtocolParameters,
    Provider,
    RewardAddress,
    Script, ScriptType,
    Transaction,
    TxHash,
    Unit,
    UTxO,
    credentialToAddress
} from "@lucid-evolution/lucid";
import {TransactionSubmissionClient} from "@cardano-ogmios/client/dist/TransactionSubmission";
import {parseFraction} from "../common/ultis";
import {EvaluationResult} from "@cardano-ogmios/client/dist/TransactionSubmission/evaluateTransaction";

export class OgmiosProvider implements Provider {
    context: InteractionContext;
    ledgerStateClient: LedgerStateQueryClient | undefined;
    transactionSubmissionClient: TransactionSubmissionClient | undefined;

    constructor(context: InteractionContext) {
        this.context = context;
        this.ledgerStateClient = undefined;
    }

    public static async getInstance(): Promise<OgmiosProvider>{
        const context = await Ogmios.createInteractionContext(
            (err) => {
                console.error("ogmios error", err)
            },
            (code, reason) => {
                console.error("ogmios close", {code, reason})
            },
            {
                connection: {
                    address: {
                        http: "https://ogmios1qx87def2yqulc2gpet5.preprod-v6.ogmios-m1.demeter.run",
                        webSocket: "wss://ogmios1qx87def2yqulc2gpet5.preprod-v6.ogmios-m1.demeter.run",
                    }
                }
            }
        );
        return new OgmiosProvider(context);
    }

    async getLedgerStateClient(): Promise<LedgerStateQueryClient> {
        if (this.ledgerStateClient) {
            return this.ledgerStateClient;
        }
        this.ledgerStateClient = await Ogmios.createLedgerStateQueryClient(this.context);
        return this.ledgerStateClient;
    }

    async getTransactionSubmissionClient(): Promise<TransactionSubmissionClient> {
        if (this.transactionSubmissionClient) {
            return this.transactionSubmissionClient;
        }
        this.transactionSubmissionClient = await Ogmios.createTransactionSubmissionClient(this.context);
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
            script: applyDoubleCborEncoding(script?.cbor)
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

    fromValue(value: Assets): Schema.Value {
        const resultValue: Schema.Value = {
            ada: {
                lovelace: value["lovelace"]
            }
        };

        for (const assetId in value) {
            if (assetId !== 'lovelace') {
                const assetAmount = value[assetId];
                const policyId = assetId.slice(0, 56);
                const assetName = assetId.slice(56);
                if (!resultValue[policyId]) {
                    resultValue[policyId] = {};
                }
                resultValue[policyId][assetName] = assetAmount;
            }
        }
        return resultValue;
    }

    fromLanguage(scriptType: ScriptType): any {
        switch (scriptType) {
            case "PlutusV1":
                return "plutus:v1";
            case "PlutusV2":
                return "plutus:v2";
            case "PlutusV3":
                return "plutus:v3";
            case "Native":
                return "native";
            default:
                throw new Error("Scripts Type is not support")
        }
    }

    fromScripts(scriptRef: Script | null | undefined): Schema.Script | null | undefined {
        if (scriptRef === undefined) {
            return undefined;
        }

        if (scriptRef === null) {
            return null;
        }
        return {
            language: this.fromLanguage(scriptRef.type),
            cbor: scriptRef.script
        }
    }

    fromUtxo(utxo: UTxO): any {
        return {
            transaction: {
                id: utxo.txHash
            },
            index: utxo.outputIndex,
            address: utxo.address,
            value: this.fromValue(utxo.assets),
            datumHash: utxo.datumHash,
            datum: utxo.datum,
            script: this.fromScripts(utxo.scriptRef),
        };
    }

    fromUtxos(utxos: UTxO[] | undefined): Schema.Utxo {
        if (!utxos) {
            return [];
        }
        return utxos.map(utxo => this.fromUtxo(utxo));
    }

    async getProtocolParameters(): Promise<ProtocolParameters> {
        const client = await this.getLedgerStateClient();
        const ogmiosProtocolParameters = await client.protocolParameters();
        const lucidProtocolParameters = this.toProtocolParameters(ogmiosProtocolParameters);
        return lucidProtocolParameters;
    }

    async getUtxos(addressOrCredential: Address | Credential): Promise<UTxO[]> {
        if (typeof addressOrCredential === "string") {
            return this.getUTxosByAddress(addressOrCredential);
        } else {
            const address = credentialToAddress("Preprod", addressOrCredential);
            return this.getUTxosByAddress(address);
        }
    }

    async getUTxosByAddress(address: Address): Promise<UTxO[]> {
        const client = await this.getLedgerStateClient();
        const utxos = await client.utxo({addresses: [address]});
        const lucidUtxos = this.toUtxos(utxos);
        return lucidUtxos;
    }

    getUtxosWithUnit(addressOrCredential: Address | Credential, unit: Unit): Promise<UTxO[]> {
        throw new Error("Method not implemented.");
    }

    getUtxoByUnit(unit: Unit): Promise<UTxO> {
        throw new Error("Method not implemented.");
    }

    toTransactionOutputReference(outRef: OutRef): Schema.TransactionOutputReference {
        return {
            transaction: {
                id: outRef.txHash
            },
            index: outRef.outputIndex
        }
    }

    toTransactionOutputReferences(outRefs: Array<OutRef>): Schema.TransactionOutputReference[] {
        return outRefs.map(outRef => this.toTransactionOutputReference(outRef));
    }

    toUtxoByOutputReferences(outRefs: Array<OutRef>): Schema.UtxoByOutputReferences {
        return {
            outputReferences: this.toTransactionOutputReferences(outRefs)
        };
    }

    async getUtxosByOutRef(outRefs: Array<OutRef>): Promise<UTxO[]> {
        const client = await this.getLedgerStateClient();
        const utxoByOutputReferences = this.toUtxoByOutputReferences(outRefs)
        const utxos = await client.utxo(utxoByOutputReferences);
        return this.toUtxos(utxos);
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

    async isConfirmed(txHash: TxHash): Promise<boolean> {
        const utxos = await this.getUtxosByOutRef([{txHash: txHash, outputIndex: 0}]);
        return utxos.length > 0
    }

    awaitTx(txHash: TxHash, checkInterval?: number): Promise<boolean> {
        const numberOfCheck = 60 * 20;
        const interval = checkInterval || 1000;

        return new Promise((resolve, reject) => {
            let count = 0;
            const intervalId = setInterval(async () => {
                if (count >= numberOfCheck) {
                    clearInterval(intervalId);
                    resolve(false);
                }
                const isConfirmed = await this.isConfirmed(txHash);
                if (isConfirmed) {
                    clearInterval(intervalId);
                    resolve(true);
                }
                count++;
            }, interval);
        });
    }

    async submitTx(tx: Transaction): Promise<TxHash> {
        const client = await this.getTransactionSubmissionClient();
        const txHash = await client.submitTransaction(tx);
        return txHash;
    }

    toEvalRedeemer(evaluationResult: EvaluationResult): EvalRedeemer {
        return {
            ex_units: {
                mem: evaluationResult.budget.memory,
                steps: evaluationResult.budget.cpu
            },
            redeemer_index: evaluationResult.validator.index,
            redeemer_tag: evaluationResult.validator.purpose
        }
    }

    toEvalRedeemers(evaluationResults: EvaluationResult[]): EvalRedeemer[] {
        return evaluationResults.map(evaluationResult => this.toEvalRedeemer(evaluationResult));
    }

    async evaluateTx(tx: Transaction, additionalUTxOs?: UTxO[]): Promise<EvalRedeemer[]> {
        const client = await this.getTransactionSubmissionClient();
        const evaluationResults = await client.evaluateTransaction(tx, this.fromUtxos(additionalUTxOs));
        return this.toEvalRedeemers(evaluationResults);
    }

}