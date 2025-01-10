import {
    getAddressDetails,
    SpendingValidator,
    validatorToAddress,
    toPublicKey,
    UTxO,
    Data,
    Datum
} from "@lucid-evolution/lucid";
import fs from "node:fs";
import {getLucidInstance} from "../src/lucid-instance";

export function getSpendingValidator(): SpendingValidator {
    const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));
    const compiledCode = plutusJson.validators[0].compiledCode;
    const plutusVersion = "PlutusV3";

    return {
        type: plutusVersion,
        script: compiledCode,
    };
}

export function getScriptsAddress(): string {
    const spend_val = getSpendingValidator();

    const scriptAddress = validatorToAddress("Preprod", spend_val);
    console.log("Script address:", scriptAddress);
    return scriptAddress;
}

export function getPrivateKey(): string {
    return fs.readFileSync("me.sk", "utf8");
}

export async function getPublicKeyHash(): Promise<string> {
    const lucid = await getLucidInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());


    const publicKeyHash = getAddressDetails(
        await lucid.wallet().address()
    ).paymentCredential?.hash;

    if (!publicKeyHash) {
        throw new Error("Unable to retrieve publicKeyHash from the wallet address");
    }

    console.log("Public key hash:", publicKeyHash);
    return publicKeyHash;
}

export async function getUTxOsFromScriptAddressByPublicKeyHash(scriptAddress: string, publicKeyHash: string): Promise<UTxO[]> {
    const lucid = await getLucidInstance();
    const scriptsAddressUtxos = await lucid.utxosAt(scriptAddress);

    const DatumSchema = Data.Object({
        owner: Data.Bytes(),
    });
    type DatumType = Data.Static<typeof DatumSchema>;
    const DatumType = DatumSchema as unknown as DatumType;

    const ownerUTxO = scriptsAddressUtxos.find((utxo) => {
        if (utxo.datum) {
            const datum = Data.from(utxo.datum, DatumType);
            return datum.owner === publicKeyHash;
        }
    });

    console.log("Owner UTxO:", ownerUTxO);

    return ownerUTxO ? [ownerUTxO] : [];
}