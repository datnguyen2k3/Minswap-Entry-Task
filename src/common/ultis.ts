import {CML, LucidEvolution, UTxO} from "@lucid-evolution/lucid";

import {MainApp} from "../main";

import {findTokenBySymbol} from "../repository/token-repository";
import {Exchange} from "../../dex/src/dex/exchange";
import {ADA_TO_LOVELACE} from "./types";

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

export async function getPrice(mainApp: MainApp, tradeToken1: string, tradeToken2: string) {
    if (tradeToken1 === 'ADA') {
        const token2 = await findTokenBySymbol(tradeToken2, mainApp.getDataSource());
        if (!token2) {
            throw new Error('Token not found');
        }
        const lpUTxO2 = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), token2.getAsset());
        return Number(Exchange.getReceivedLovelaceBySwapTradeToken(lpUTxO2, BigInt(10000), token2.getContractName())) / 10000;
    } else if (tradeToken2 === 'ADA') {
        const token1 = await findTokenBySymbol(tradeToken1, mainApp.getDataSource());
        if (!token1) {
            throw new Error('Token not found');
        }
        const lpUTxO1 = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), token1.getAsset());
        return Number(Exchange.getReceivedLovelaceBySwapTradeToken(lpUTxO1, BigInt(10000), token1.getContractName())) / (10000 * ADA_TO_LOVELACE);
    } else {
        const token1 = await findTokenBySymbol(tradeToken1, mainApp.getDataSource());
        const token2 = await findTokenBySymbol(tradeToken2, mainApp.getDataSource());
        if (!token1 || !token2) {
            throw new Error('Token not found');
        }

        const lpUTxO1 = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), token1.getAsset());
        const lpUTxO2 = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), token2.getAsset());

        const bridgeLovelace = Exchange.getReceivedLovelaceBySwapTradeToken(lpUTxO1, BigInt(10000), token1.getContractName());
        return Number(Exchange.getReceivedTradeTokenBySwapAda(lpUTxO2, BigInt(bridgeLovelace), token2.getContractName())) / 10000;
    }
}

export function isValidPolicyId(policyId: string): boolean {
    const policyIdRegex = /^[0-9a-fA-F]{56}$/;
    return policyIdRegex.test(policyId);
}
