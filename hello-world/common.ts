import {
    CML,
    Data,
    Datum,
    LucidEvolution,
    TxSignBuilder,
    UTxO,
    Validator,
    validatorToAddress
} from "@lucid-evolution/lucid";
import fs from "node:fs";
import * as path from "path";
import {getLucidOgmiosInstance} from "../src/providers/lucid-instance";

export function getCompliedCode(validator_title: string): string {
    const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));
    const compiledCode = plutusJson.validators.find((validator: any) => validator.title === validator_title).compiledCode;

    if (!compiledCode) {
        throw new Error("Compiled code not found");
    }

    return compiledCode;
}

export function getCompliedCodeFrom(validator_title: string, pathStr: string): string {
    const absolutePath = path.resolve(pathStr);
    const plutusJson = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
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

export function getValidatorFrom(validator_title: string, plutusFilePath: string): Validator {
    return {
        type: 'PlutusV3',
        script: getCompliedCodeFrom(validator_title, plutusFilePath),
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

export function getPrivateKeyFrom(path_str: string): string {
    const absolutePath = path.resolve(path_str);
    return fs.readFileSync(absolutePath, "utf8");
}

export function savePrivateKey(privateKey: string, path_str: string): void {
    const absolutePath = path.resolve(path_str);
    fs.writeFileSync(absolutePath, privateKey);
}

export function getPublicKeyHash(privateKeyBech32: string): string {
    const privateKey = CML.PrivateKey.from_bech32(privateKeyBech32);
    const publicKey = privateKey.to_public();
    const publicKeyHash = publicKey.hash();

    return publicKeyHash.to_hex();
}

export function getAddress(privateKeyBech32: string): string {
    const privateKey = CML.PrivateKey.from_bech32(privateKeyBech32);
    const publicKey = privateKey.to_public();
    const publicKeyHash = publicKey.hash();

    return CML.EnterpriseAddress.new(
        0,
        CML.Credential.new_pub_key(publicKeyHash)
    ).to_address().to_bech32();
}

export function toCBOR(data: Object, DataSchema: any): Datum {
    type SchemeType = Data.Static<typeof DataSchema>;
    const SchemeType = DataSchema as unknown as SchemeType;
    return Data.to<SchemeType>(data, SchemeType);
}

export function toObject(datum: Datum | undefined | null, DataSchema: any): any {
    if (!datum) {
        throw new Error("Datum is undefined");
    }

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