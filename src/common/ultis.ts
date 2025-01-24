import {CML, LucidEvolution, UTxO} from "@lucid-evolution/lucid";

export function parseFraction(fraction: string): number {
    const [numerator, denominator] = fraction.split('/').map(Number);
    return numerator / denominator;
}

export function sortUTxO(utxos: UTxO[]) {
    utxos.sort((a, b) =>
        a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
    );
}

export function utf8ToHex(str: string): string {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(str);
    return Array.from(utf8Bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

export function validatePrivateKey(privateKey: string): boolean {
    try {
        CML.PrivateKey.from_bech32(privateKey);
        return true;
    } catch (e) {
        return false;
    }
}

export async function getAssets(address: string, lucid: LucidEvolution) {
    const utxos = await lucid.utxosAt(address);
    const assets = new Map<string, number>();

    for (const utxo of utxos) {
        for (const assetName in utxo.assets) {
            const value = utxo.assets[assetName as keyof typeof utxo.assets]
            assets.set(
                assetName,
                (assets.get(assetName) || 0) + Number(value)
            )
        }
    }

    return assets;
}
