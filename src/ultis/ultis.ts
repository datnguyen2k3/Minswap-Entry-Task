import {UTxO} from "@lucid-evolution/lucid";

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
