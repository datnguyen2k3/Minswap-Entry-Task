import {getLucidOgmiosInstance} from "../src/providers/lucid-instance";
import {
    getPrivateKey,
    getPublicKeyHash,
    getScriptsAddress,
    getValidator,
    getUTxOsFromScriptAddressByPublicKeyHash, submitTx
} from "./common";
import {Constr, Data, UTxO, Validator, SpendingValidator} from "@lucid-evolution/lucid";
import {utf8ToHex} from "../src/common/ultis";

const helloWorldTitle = "hello_world.hello_world.spend";

async function main() {
    const scriptAddress = getScriptsAddress(helloWorldTitle);
    const publicKeyHash = getPublicKeyHash(getPrivateKey());
    const utxos = await getUTxOsFromScriptAddressByPublicKeyHash(scriptAddress, publicKeyHash);
    const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello, World!")]));
    const receiveAddress = "addr_test1vpfsn7ncdptvzf3dp9dcnt0kfl522f266xg59jw9xu6eusgmessnp";
    const spendingValidator = getValidator(helloWorldTitle);

    await unlock_assets(
        utxos,
        spendingValidator,
        "spend",
        BigInt(1000000),
        redeemer,
        receiveAddress
    );
}

export async function unlock_assets(utxos: UTxO[], validator: Validator, purpose: string, amount: bigint, redeemer: string, receiveAddress: string): Promise<void> {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const tx = lucid
        .newTx()
        .collectFrom(utxos, redeemer)
        .addSigner(await lucid.wallet().address())
        .pay.ToAddress(
            receiveAddress,
            {lovelace: BigInt(amount)}
        )

    if (purpose === "spend") {
        tx.attach.SpendingValidator(validator);
    }

    const completeTx = await tx.complete();
    await submitTx(completeTx, lucid);
}

// main();