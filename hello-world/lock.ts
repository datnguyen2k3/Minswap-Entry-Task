import {getLucidInstance} from "../src/lucid-instance";
import fs from "node:fs";
import {Constr, Data, getAddressDetails, SpendingValidator, validatorToAddress} from "@lucid-evolution/lucid";
import {getPrivateKey, getPublicKeyHash, getScriptsAddress} from "./common";

async function main(): Promise<void> {
    const lucid = await getLucidInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const scriptAddress = getScriptsAddress();
    const publicKeyHash = await getPublicKeyHash();
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

    console.log("Waiting for transaction to be confirmed...");

    const isSuccess = await lucid.awaitTx(txHash);

    if (isSuccess) {
        console.log("Transaction confirmed!");
    } else {
        console.error("Transaction failed!");
    }
}

main();