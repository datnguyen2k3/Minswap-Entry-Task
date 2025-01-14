import {getLucidOgmiosInstance} from "../src/lucid-instance";
import {
    getPrivateKey,
    getPublicKeyHash,
    getScriptsAddress,
    getValidator,
    getUTxOsFromScriptAddressByPublicKeyHash, submitTx
} from "./common";
import {Constr, Data, UTxO, Validator, SpendingValidator} from "@lucid-evolution/lucid";
import {utf8ToHex} from "../src/ultis/ultis";

async function main() {
    const scriptAddress = getScriptsAddress(0);
    const publicKeyHash = await getPublicKeyHash();
    const utxos = await getUTxOsFromScriptAddressByPublicKeyHash(scriptAddress, publicKeyHash);
    const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello, World!")]));
    const receiveAddress = "addr_test1vpfsn7ncdptvzf3dp9dcnt0kfl522f266xg59jw9xu6eusgmessnp";
    const spendingValidator = getValidator(0);

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