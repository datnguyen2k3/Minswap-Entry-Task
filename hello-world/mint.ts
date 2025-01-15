import {getPrivateKey, getValidator, submitTx, toCBOR} from "./common";
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

const mintValidatorIndex = 3;

export type AppliedValidators = {
    redeem: SpendingValidator;
    giftCardScripts: MintingPolicy;
    policyId: string;
    giftCardScriptsAddress: string;
};

const OutRefScheme = Data.Object({
    transaction_id: Data.Bytes(),
    output_index: Data.Integer(),
});

export function applyParams(
    tokenName: string,
    outputReference: OutRef,
    validatorScripts: string
): AppliedValidators {
    const outRef = new Constr(0, [
        new Constr(0, [outputReference.txHash]),
        BigInt(outputReference.outputIndex),
    ]);

    const scriptsWithParams = applyParamsToScript(validatorScripts, [
        fromText(tokenName),
        outRef,
    ]);

    const policyId = validatorToScriptHash({
        type: "PlutusV3",
        script: scriptsWithParams,
    });

    const scriptsAddress = validatorToAddress("Preprod", {
        type: "PlutusV3",
        script: scriptsWithParams,
    });

    return {
        redeem: {type: "PlutusV3", script: scriptsWithParams},
        giftCardScripts: {type: "PlutusV3", script: scriptsWithParams},
        policyId,
        giftCardScriptsAddress: scriptsAddress,
    };
}

async function getAppliedValidators(tokenName: string): Promise<AppliedValidators> {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const utxos = await lucid.wallet().getUtxos();

    const utxo = utxos[0];
    console.log("UTxO 0:", utxo);

    const outputReference = {
        txHash: utxo.txHash,
        outputIndex: utxo.outputIndex
    };

    console.log("validator:", getValidator(mintValidatorIndex).script);
    const validatorScripts = applyDoubleCborEncoding(getValidator(mintValidatorIndex).script);

    return applyParams(tokenName, outputReference, validatorScripts);
}

async function createGiftCard(tokenName: string, giftADA: bigint): Promise<void> {
    const lovelace = giftADA * BigInt(1000000);
    const parameterizedContracts = await getAppliedValidators(tokenName);
    console.log("Parameterized contracts:", parameterizedContracts);

    const assetName = `${parameterizedContracts!.policyId}${fromText(
        tokenName
    )}`

    const mintRedeemer = Data.to(new Constr(0, []));
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const utxos = await lucid.wallet().getUtxos();
    const utxo = utxos[0];
    console.log("UTxO 0:", utxo);

    const tx = await lucid!
        .newTx()
        .collectFrom([utxo])
        .attach.MintingPolicy(parameterizedContracts!.giftCardScripts)
        .mintAssets({[assetName]: BigInt(1)}, mintRedeemer)
        .pay.ToContract(
            parameterizedContracts!.giftCardScriptsAddress,
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