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
import {getLucidOgmiosInstance} from "../src/lucid-instance";

export function getSpendingValidator(validator_index: number): SpendingValidator {
    const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));
    const compiledCode = plutusJson.validators[validator_index].compiledCode;
    const plutusVersion = "PlutusV3";

    return {
        type: plutusVersion,
        script: compiledCode,
    };
}

export function getScriptsAddress(validator_index: number): string {
    const spend_val = getSpendingValidator(validator_index);

    const scriptAddress = validatorToAddress("Preprod", spend_val);
    console.log("Script address:", scriptAddress);
    return scriptAddress;
}

export function getPrivateKey(): string {
    return fs.readFileSync("me.sk", "utf8");
}

export async function getPublicKeyHash(): Promise<string> {
    const lucid = await getLucidOgmiosInstance();
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

export function toCBOR(data: Object, DataSchema: any): Datum {
    type SchemeType = Data.Static<typeof DataSchema>;
    const SchemeType = DataSchema as unknown as SchemeType;
    return Data.to<SchemeType>(data, SchemeType);
}

export function toObject(datum: Datum, DataSchema: any): any {
    type SchemeType = Data.Static<typeof DataSchema>;
    const SchemeType = DataSchema as unknown as SchemeType;
    return Data.from(datum, SchemeType);
}

export async function getUTxOsFromScriptAddressByPublicKeyHash(scriptAddress: string, publicKeyHash: string): Promise<UTxO[]> {
    const lucid = await getLucidOgmiosInstance();
    const scriptsAddressUtxos = await lucid.utxosAt(scriptAddress);

    const DatumSchema = Data.Object({
        owner: Data.Bytes(),
    });

    const ownerUTxOs: UTxO[] = [];

    for (const utxo of scriptsAddressUtxos) {
        if (utxo.datum) {
            try {
                const datum = toObject(utxo.datum, DatumSchema);
                if (datum.owner === publicKeyHash) {
                    ownerUTxOs.push(utxo);
                }
            } catch (e) {
                if (e instanceof Error && e.message === "Could not type cast to object.") {
                    continue;
                }
                console.error("Error parsing datum:", e);
            }
        }
    }

    console.log("Owner UTxO:", ownerUTxOs);
    return ownerUTxOs;
}