import {getLucidOgmiosInstance} from "../src/lucid-instance";
import {
    getPrivateKey,
    getPublicKeyHash,
    getScriptsAddress,
    getSpendingValidator,
    getUTxOsFromScriptAddressByPublicKeyHash
} from "./common";
import {Constr, Data} from "@lucid-evolution/lucid";
import {getBlockfrostInstance} from "../src/providers/blockfrost-provider";

function utf8ToHex(str: string): string {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(str);
    return Array.from(utf8Bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function main() {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const scriptAddress = getScriptsAddress(0);
    const publicKeyHash = await getPublicKeyHash();
    const amount = 1000000;
    const datum = Data.to(new Constr(0, [publicKeyHash]));
    const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello, World!")]));

    const utxos = await getUTxOsFromScriptAddressByPublicKeyHash(scriptAddress, publicKeyHash);

    const tx = await lucid
        .newTx()
        .collectFrom(utxos, redeemer)
        .addSigner(await lucid.wallet().address())
        .attach.SpendingValidator(getSpendingValidator(0))
        .pay.ToAddress(
            "addr_test1vpfsn7ncdptvzf3dp9dcnt0kfl522f266xg59jw9xu6eusgmessnp",
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