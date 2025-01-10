import {getAddressDetails, SpendingValidator, validatorToAddress, toPublicKey} from "@lucid-evolution/lucid";
import fs from "node:fs";
import {getLucidInstance} from "../src/lucid-instance";

export function getScriptsAddress(): string {
    const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));
    const compiledCode = plutusJson.validators[0].compiledCode;
    const plutusVersion = "PlutusV3";

    const spend_val: SpendingValidator = {
        type: plutusVersion,
        script: compiledCode, // from plutus.json of the compiled contract code, this is the compiled script in CBOR format
    };

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