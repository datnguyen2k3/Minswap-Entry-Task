import {getPrivateKey, getValidator, submitTx} from "./common";
import {getLucidOgmiosInstance} from "../src/providers/lucid-instance";
import {
    applyDoubleCborEncoding,
    applyParamsToScript,
    Constr,
    Data,
    fromText,
    MintingPolicy,
    OutRef, sortUTxOs,
    SpendingValidator,
    validatorToAddress,
    validatorToScriptHash
} from "@lucid-evolution/lucid";

const mintValidatorTitle = "onshot.gift_card.else";

export type Validators = {
  giftCard: string;
};

export function readValidators(): Validators {
  return {
    giftCard: getValidator(mintValidatorTitle).script,
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

async function redeemGiftCard(tokenName: string, parameterizedContracts: AppliedValidators): Promise<void> {
    const burnRedeemer = Data.to(new Constr(1, []));

    const assetName = `${parameterizedContracts!.policyId}${fromText(
        tokenName
      )}`;

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());
    const utxos = await lucid.utxosAt(parameterizedContracts.lockAddress);

    const tx = await lucid!
        .newTx()
        .collectFrom(utxos, Data.void())
        .attach.MintingPolicy(parameterizedContracts.giftCard)
        .attach.SpendingValidator(parameterizedContracts.redeem)
        .mintAssets({ [assetName]: BigInt(-1) }, burnRedeemer)
        .complete();

    await submitTx(tx, lucid);
}

function main() {
    // createGiftCard("Hello", BigInt(1)).then(r => console.log("Done!")).catch(e => console.error(e));


//     const parameterizedContracts: AppliedValidators = {
//   redeem: {
//     type: 'PlutusV3',
//     script: '5902ac5902a9010100333232323232323223222533300532323232323232323232532333010300500613233223232325333016300730173754002264a66602e601860306ea80044c8c94ccc070c07c0084c94ccc068cdc39bad301c002480044cdc780080c0a50375c60340022c603a002660160066eb8c070c064dd50008b1804980c1baa3009301837546036603860306ea8c06cc060dd50008b198039bac301a00223375e601260306ea8004014dd5980c980d180d180d180d000980a9baa00c3016001301630170013012375400e2a666020600200c2646464a66602660080022a66602c602a6ea802c0085854ccc04cc02000454ccc058c054dd50058010b0b18099baa00a132325333016301900213232533301530063016375401a2a66602a600c602c6ea8cc01cdd61804180b9baa00e23375e601260306ea800404c54ccc054c0280044cdc78010098a5016153330153370e0029000899b8f00201314a06eb4c058008dd7180a0008b180b800998029bab30163017301730173017301337540140026eb8c054c048dd50038b1b874800088c8cc00400400c894ccc0540045300103d87a8000133225333014300500213374a90001980c00125eb804cc010010004c05c004c0600048c04c00488c94ccc03cc010c040dd50008a5eb7bdb1804dd5980a18089baa001323300100100322533301300114c103d87a800013233322253330143372200e0062a66602866e3c01c00c4cdd2a4000660306e980092f5c02980103d87a8000133006006001375c60240026eacc04c004c05c008c054004dc3a400460166ea8004c038c03c00cc034008c030008c030004c01cdd50008a4c26cac6eb80055cd2ab9d5573caae7d5d02ba157449801064548656c6c6f004c0127d8799f58202d10698ec3f57dae89a076b8ae13da687b7850c1eb20dbdab099855303f86da301ff0001'
//   },
//   giftCard: {
//     type: 'PlutusV3',
//     script: '5902ac5902a9010100333232323232323223222533300532323232323232323232532333010300500613233223232325333016300730173754002264a66602e601860306ea80044c8c94ccc070c07c0084c94ccc068cdc39bad301c002480044cdc780080c0a50375c60340022c603a002660160066eb8c070c064dd50008b1804980c1baa3009301837546036603860306ea8c06cc060dd50008b198039bac301a00223375e601260306ea8004014dd5980c980d180d180d180d000980a9baa00c3016001301630170013012375400e2a666020600200c2646464a66602660080022a66602c602a6ea802c0085854ccc04cc02000454ccc058c054dd50058010b0b18099baa00a132325333016301900213232533301530063016375401a2a66602a600c602c6ea8cc01cdd61804180b9baa00e23375e601260306ea800404c54ccc054c0280044cdc78010098a5016153330153370e0029000899b8f00201314a06eb4c058008dd7180a0008b180b800998029bab30163017301730173017301337540140026eb8c054c048dd50038b1b874800088c8cc00400400c894ccc0540045300103d87a8000133225333014300500213374a90001980c00125eb804cc010010004c05c004c0600048c04c00488c94ccc03cc010c040dd50008a5eb7bdb1804dd5980a18089baa001323300100100322533301300114c103d87a800013233322253330143372200e0062a66602866e3c01c00c4cdd2a4000660306e980092f5c02980103d87a8000133006006001375c60240026eacc04c004c05c008c054004dc3a400460166ea8004c038c03c00cc034008c030008c030004c01cdd50008a4c26cac6eb80055cd2ab9d5573caae7d5d02ba157449801064548656c6c6f004c0127d8799f58202d10698ec3f57dae89a076b8ae13da687b7850c1eb20dbdab099855303f86da301ff0001'
//   },
//   policyId: '1679adaf8d147a12abbfb5574a107a6c0106593b54e15a565fa29adc',
//   lockAddress: 'addr_test1wqt8ntd035285y4th764wjss0fkqzpje8d2wzkjkt73f4hqgfpsfg'
// };
//     redeemGiftCard("Hello", parameterizedContracts).then(r => console.log("Done!")).catch(e => console.error(e));
}

main();