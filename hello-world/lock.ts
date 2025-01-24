import {getLucidOgmiosInstance} from "../src/providers/lucid-instance";
import {Data} from "@lucid-evolution/lucid";
import {getPrivateKey, getPublicKeyHash, getScriptsAddress, submitTx, toCBOR} from "./common";

const DatumScheme1 = Data.Object({
    owner: Data.Bytes(),
});

const helloWorldTitle = "hello_world.hello_world.spend";

async function main(): Promise<void> {
    const datum = toCBOR({owner: getPublicKeyHash(getPrivateKey())}, DatumScheme1);
    const scriptAddress = getScriptsAddress(helloWorldTitle);
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

    await submitTx(tx, lucid);
}

// main();