import {getLucidOgmiosInstance} from "../src/lucid-instance";
import {
    getPrivateKey,
    getPublicKeyHash,
    getScriptsAddress,
    getSpendingValidator,
    getUTxOsFromScriptAddressByPublicKeyHash
} from "./common";
import {Constr, Data, UTxO} from "@lucid-evolution/lucid";
import {utf8ToHex} from "../src/ultis/ultis";

async function main() {
    const scriptAddress = getScriptsAddress(0);
    const publicKeyHash = await getPublicKeyHash();
    const utxos = await getUTxOsFromScriptAddressByPublicKeyHash(scriptAddress, publicKeyHash);
    const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello, World!")]));
    const receiveAddress = "addr_test1vpfsn7ncdptvzf3dp9dcnt0kfl522f266xg59jw9xu6eusgmessnp";

    await unlock_assets(utxos, BigInt(1000000), redeemer, receiveAddress);
}

export async function unlock_assets(utxos: UTxO[], amount: bigint, redeemer: string, receiveAddress: string): Promise<void> {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const tx = await lucid
        .newTx()
        .collectFrom(utxos, redeemer)
        .addSigner(await lucid.wallet().address())
        .attach.SpendingValidator(getSpendingValidator(0))
        .pay.ToAddress(
            receiveAddress,
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