import { InteractionContext, Schema } from "@cardano-ogmios/client";
import { LedgerStateQueryClient } from "@cardano-ogmios/client/dist/LedgerStateQuery";
import { Address, Assets, Credential, Datum, DatumHash, Delegation, EvalRedeemer, OutRef, ProtocolParameters, Provider, RewardAddress, Script, Transaction, TxHash, Unit, UTxO } from "@lucid-evolution/lucid";
import * as Ogmios from "@cardano-ogmios/client";

export class OgmiosProvider implements Provider {
  context: InteractionContext;
  ledgerStateClient: LedgerStateQueryClient | undefined;

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

    return {
      minFeeA: result.minFeeCoefficient,
      minFeeB: Number(result.minFeeConstant.ada.lovelace),
      maxTxSize: result.maxTransactionSize.bytes,
      maxValSize: result.maxValueSize.bytes,
      keyDeposit: BigInt(result.stakeCredentialDeposit.ada.lovelace),
      poolDeposit: BigInt(result.stakePoolDeposit.ada.lovelace),
      drepDeposit: BigInt(result.delegateRepresentativeDeposit.ada.lovelace),
      govActionDeposit: BigInt(result.governanceActionDeposit.ada.lovelace),
      priceMem: 0, // TODO: FIX ME!
        // result.scriptExecutionPrices.memory[0] /
        // result.scriptExecutionPrices.memory[1],
      priceStep: 0, // TODO: FIX ME!
        // result.scriptExecutionPrices.cpu[0] / result.scriptExecutionPrices.cpu[1],
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
            index.toString(),
            value,
          ]),
        ),
        PlutusV2: Object.fromEntries(
          result.plutusCostModels["plutus:v2"].map((value, index) => [
            index.toString(),
            value,
          ]),
        ),
        PlutusV3: Object.fromEntries(
          result.plutusCostModels["plutus:v3"].map((value, index) => [
            index.toString(),
            value,
          ]),
        ),
      },
    };
  };

  toAsset(value: Schema.Value): Assets {
    throw new Error("Method not implemented.");
  }

  toScript(script?: Schema.Script): Script | undefined {
    throw new Error("Method not implemented.");
  }

  toUtxos(utxos: Schema.Utxo): UTxO[] {
    const result: UTxO[] = [];
    for (const utxo of utxos) {
      const lucidUtxo: UTxO = {
        txHash: utxo.transaction.id,
        outputIndex: utxo.index,
        address: utxo.address,
        assets: this.toAsset(utxo.value),
        datumHash: utxo.datumHash,
        datum: utxo.datum,
        scriptRef: this.toScript(utxo.script),
      };
      result.push(lucidUtxo);
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
      const utxos = await client.utxo({ addresses: [addressOrCredential] });
      const lucidUtxos = this.toUtxos(utxos);
      return lucidUtxos;
    } else {
      throw Error("Not Support");
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
  getDelegation(rewardAddress: RewardAddress): Promise<Delegation> {
    throw new Error("Method not implemented.");
  }
  getDatum(datumHash: DatumHash): Promise<Datum> {
    throw new Error("Method not implemented.");
  }
  awaitTx(txHash: TxHash, checkInterval?: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  submitTx(tx: Transaction): Promise<TxHash> {
    throw new Error("Method not implemented.");
  }
  evaluateTx(tx: Transaction, additionalUTxOs?: UTxO[]): Promise<EvalRedeemer[]> {
    throw new Error("Method not implemented.");
  }

}