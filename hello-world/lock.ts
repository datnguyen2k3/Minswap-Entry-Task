import {getLucidOgmiosInstance} from "../src/lucid-instance";
import {Data} from "@lucid-evolution/lucid";
import {getPrivateKey, getPublicKeyHash, getScriptsAddress, toCBOR} from "./common";

const DatumScheme1 = Data.Object({
    owner: Data.Bytes(),
});

async function main(): Promise<void> {
    const datum = toCBOR({owner: await getPublicKeyHash()}, DatumScheme1);
    const scriptAddress = getScriptsAddress(0);
    await lock_assets(scriptAddress, BigInt(1000000), datum);
}

export async function lock_assets(scriptAddress: string, assets: bigint, datum: string): Promise<void> {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const tx = await lucid
        .newTx()
        .pay.ToAddressWithData(
            scriptAddress,
            {kind: "inline", value: datum},
            {lovelace: BigInt(assets)}
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

// main();