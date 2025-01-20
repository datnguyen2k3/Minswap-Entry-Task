import {
    getAddressDetails,
    SpendingValidator,
    validatorToAddress,
    toPublicKey,
    UTxO,
    Data,
    Datum, TxSignBuilder, LucidEvolution, Validator
} from "@lucid-evolution/lucid";
import fs from "node:fs";
import {getLucidOgmiosInstance} from "../src/lucid-instance";

export function getCompliedCode(validator_title: string): string {
    const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));
    const compiledCode = plutusJson.validators.find((validator: any) => validator.title === validator_title).compiledCode;

    if (!compiledCode) {
        throw new Error("Compiled code not found");
    }

    return compiledCode;
}

export function getValidator(validator_title: string): Validator {
    return {
        type: 'PlutusV3',
        script: getCompliedCode(validator_title),
    };
}

export function getScriptsAddress(validator_title: string): string {
    const validator = getValidator(validator_title);

    const scriptAddress = validatorToAddress("Preprod", validator);
    console.log("Script address:", scriptAddress);
    return scriptAddress;
}

export function getPrivateKey(): string {
    return fs.readFileSync("me.sk", "utf8");
}

export async function getPublicKeyHash(privateKey: string): Promise<string> {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);


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

export function isCantCastCborToObject(e: unknown): boolean {
    return e instanceof Error && e.message === "Could not type cast to object.";
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
                if (isCantCastCborToObject(e)) {
                    continue;
                }
                console.error("Error parsing datum:", e);
            }
        }
    }

    console.log("Owner UTxO:", ownerUTxOs);
    return ownerUTxOs;
}

export async function submitTx(tx: TxSignBuilder, lucid: LucidEvolution) {
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