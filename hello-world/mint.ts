import {getPrivateKey, getValidator, submitTx} from "./common";
import {getLucidOgmiosInstance} from "../src/lucid-instance";
import {
    applyDoubleCborEncoding,
    applyParamsToScript,
    Constr,
    Data,
    fromText,
    MintingPolicy,
    OutRef,
    SpendingValidator,
    validatorToAddress,
    validatorToScriptHash
} from "@lucid-evolution/lucid";

export type Validators = {
  giftCard: string;
};

export function readValidators(): Validators {
  return {
    giftCard: getValidator(3).script,
  };
}

const validator = readValidators().giftCard;

export type AppliedValidators = {
  redeem: SpendingValidator;
  giftCard: MintingPolicy;
  policyId: string;
  lockAddress: string;
};

export function applyParams(
  tokenName: string,
  outputReference: OutRef,
  validator: string
): AppliedValidators {
  const txId = outputReference.txHash;
  const txTdx = BigInt(outputReference.outputIndex);

  const outRef = new Constr(0, [txId, txTdx]);

  const giftCard = applyParamsToScript(applyDoubleCborEncoding(validator), [
    fromText(tokenName),
    outRef,
  ]);

  const policyId = validatorToScriptHash({
    type: "PlutusV3",
    script: giftCard,
  });

  const lockAddress = validatorToAddress("Preprod", {
    type: "PlutusV3",
    script: giftCard,
  });

  return {
    redeem: { type: "PlutusV3", script: applyDoubleCborEncoding(giftCard) },
    giftCard: { type: "PlutusV3", script: applyDoubleCborEncoding(giftCard) },
    policyId,
    lockAddress,
  };
}

async function submitTokenName(tokenName: string): Promise<AppliedValidators> {
  const lucid = await getLucidOgmiosInstance();
  lucid.selectWallet.fromPrivateKey(getPrivateKey());

  const utxos = await lucid.wallet().getUtxos();

  const utxo = utxos[0];
  const outputReference = {
    txHash: utxo.txHash,
    outputIndex: utxo.outputIndex
  };

  return applyParams(tokenName, outputReference, validator);
}

async function createGiftCard(tokenName: string, giftADA: bigint): Promise<void> {
    const lovelace = giftADA * BigInt(1000000);
    const parameterizedContracts = await submitTokenName(tokenName);
    console.log("Parameterized contracts:", parameterizedContracts);

    const assetName = `${parameterizedContracts.policyId}${fromText(
        tokenName
    )}`

    const mintRedeemer = Data.to(new Constr(0, []));
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const utxos = await lucid.wallet().getUtxos();
    const utxo = utxos[0];
    console.log("UTxO 0:", utxo);

    const tx = await lucid
        .newTx()
        .collectFrom([utxo])
        .attach.MintingPolicy(parameterizedContracts.giftCard)
        .mintAssets({[assetName]: BigInt(1)}, mintRedeemer)
        .pay.ToContract(
            parameterizedContracts.lockAddress,
            {kind: 'inline', value: Data.void()},
            {lovelace: BigInt(lovelace)}
        )
        .complete();

    await submitTx(tx, lucid);
}

function main() {
    createGiftCard("Hello", BigInt(1)).then(r => console.log("Done!")).catch(e => console.error(e));
}

main();