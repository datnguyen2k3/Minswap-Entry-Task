import {getLucidInstance} from "../src/lucid-instance";
import fs from "node:fs";
import {Constr, Data, getAddressDetails, SpendingValidator, validatorToAddress} from "@lucid-evolution/lucid";

async function main(): Promise<void> {
    const lucid = await getLucidInstance();

    const privateKey = fs.readFileSync("me.sk", "utf8");
    lucid.selectWallet.fromPrivateKey(privateKey);

    const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));
    const compiledCode = plutusJson.validators[0].compiledCode;
    const plutusVersion = "PlutusV3";

    const spend_val: SpendingValidator = {
        type: plutusVersion,
        script: compiledCode, // from plutus.json of the compiled contract code, this is the compiled script in CBOR format
    };

    const scriptAddress = validatorToAddress("Preprod", spend_val);
    console.log("Script address:", scriptAddress);

    const publicKeyHash = getAddressDetails(
        await lucid.wallet().address()
    ).paymentCredential?.hash;

    if (!publicKeyHash) {
        throw new Error("Unable to retrieve publicKeyHash from the wallet address");
    }

    const datum = Data.to(new Constr(0, [publicKeyHash]));

    const amount = 1000000;
    const tx = await lucid
        .newTx()
        .pay.ToAddressWithData(
            scriptAddress,
            {kind: "inline", value: datum},
            {lovelace: BigInt(amount)}
        )
        .complete();

    const signedTx = await tx.sign.withWallet().complete();
    const txHash = await signedTx.submit();
    console.log("TxHash: ", txHash);

    // await lucid.awaitTx(txHash);
    // console.log("Transaction confirmed:");
}

main();