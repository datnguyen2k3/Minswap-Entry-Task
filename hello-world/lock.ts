import {getLucidOgmiosInstance} from "../src/lucid-instance";
import {Constr, Data} from "@lucid-evolution/lucid";
import {getPrivateKey, getPublicKeyHash, getScriptsAddress} from "./common";

async function main(): Promise<void> {
    await lock_assets(0, BigInt(1000000));
}

export async function lock_assets(validator_index: number, assets: bigint): Promise<void> {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const scriptAddress = getScriptsAddress(validator_index);
    const publicKeyHash = await getPublicKeyHash();
    const datum = Data.to(new Constr(0, [publicKeyHash]));

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

main();