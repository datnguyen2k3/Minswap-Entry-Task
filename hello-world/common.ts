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

export function getKeyFrom(path_str: string): string {
    const absolutePath = path.resolve(path_str);
    return fs.readFileSync(absolutePath, "utf8");
}

export function saveKeyFrom(privateKey: string, path_str: string): void {
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
//
// import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
//
// import { Asset, DataObject, DexV2, NetworkId } from "../src";
// import { BlockfrostAdapter } from "../src/adapters/blockfrost";
// import { OutRef } from "@spacebudz/lucid";
// import { getBackendLucidInstance } from "../src/utils/lucid";
//
// const main = async () => {
//     // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//     const x = DataObject.from(
//         "d8799fd8799fd8799f581cf2ca9cb36e2b3a0d9886319af10a98078445258f0b303c5afa460438ffd8799fd8799fd8799f581c38c1c81defe3f8ab0476c7e89a13cb2065030431bfb7a4cfd2eb38f8ffffffff01d87a9fd8799f581ce16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72434d494effffff"
//     );
//     console.log(x);
//     console.log("Hi");
//     const blockFrostApi = new BlockFrostAPI({
//         projectId: "preprodciFT6wxONc6nrqUAknGp47PUvOzeIyne",
//         network: "preprod",
//     });
//     const adapter = new BlockfrostAdapter(NetworkId.TESTNET, blockFrostApi);
//
//     const minAdaPool = await adapter.getV2PoolByPair(
//         Asset.fromString("lovelace"),
//         Asset.fromString(
//             "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed724d494e"
//         )
//     );
//
//     if (minAdaPool) {
//         const [a, b] = await adapter.getV2PoolPrice({ pool: minAdaPool });
//         console.log(
//             `ADA/MIN price: ${a.toString()}; MIN/ADA price: ${b.toString()}`
//         );
//     }
//
//
//
// };
//
// async function testTx() {
//     const blockFrostApi = new BlockFrostAPI({
//         projectId: "preprodciFT6wxONc6nrqUAknGp47PUvOzeIyne",
//         network: "preprod",
//     });
//     const adapter = new BlockfrostAdapter(NetworkId.TESTNET, blockFrostApi);
//
//     const lucid = await getBackendLucidInstance(
//         "Preprod",
//         "preprodciFT6wxONc6nrqUAknGp47PUvOzeIyne",
//         "https://cardano-preprod.blockfrost.io/api/v0",
//         "addr_test1vrd9v47japxwp8540vsrh4grz4u9urfpfawwy7sf6r0vxqgm7wdxh"
//     )
//
//     lucid.selectWalletFromPrivateKey("ed25519_sk19t78zcdpvljnpk2lk82urwvauk99q62j0lae0lcng3an0e7lgp3qg0m6yh")
//
//     const dexV2 = new DexV2(lucid, adapter);
//     const outRef: OutRef = {
//         txHash: "958fc07147d78660e76a706085460961f662b2fbb9ff10c2e697a9351446b3d8",
//         outputIndex: 0,
//     }
//
//
//     const tx = await dexV2.createPoolTx({
//         assetA: {
//             policyId: "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72",
//             tokenName: "MIN"
//         },
//         assetB: {
//             policyId: "0f6b02150cbcc7fedafa388abcc41635a9443afb860100099ba40f07",
//             tokenName: "TRASH_TOKEN"
//         },
//         amountA: BigInt(1000),
//         amountB: BigInt(1000),
//         tradingFeeNumerator: BigInt(1),
//
//     });
//
//
//
//     const signedTx = await tx
//         .signWithPrivateKey('ed25519_sk19t78zcdpvljnpk2lk82urwvauk99q62j0lae0lcng3an0e7lgp3qg0m6yh')
//         .commit();
//
//     const txId = await signedTx.submit();
// }
//
// testTx();
