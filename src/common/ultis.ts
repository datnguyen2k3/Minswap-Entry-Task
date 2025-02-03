import {CML, LucidEvolution, UTxO} from "@lucid-evolution/lucid";
import {getTradingPairs} from "../repository/trading-pair-repository";
import {Token} from "../entities/token";
import {MainApp} from "../main";
import {Exchange} from "../../dex/src/dex/exchange";
import {ADMIN_PUBLIC_KEY_HASH} from "./types";
import {DataSource} from "typeorm";
import {TradingPair} from "../entities/trading-pair";
import {findTokenBySymbol} from "../repository/token-repository";

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

export async function getTradingPairsAndPrice(mainApp: MainApp, page: number, perPage: number) {
    const tradingPairs = await getTradingPairs(mainApp.getDataSource(), page, perPage);
    const pairAndPrice = new Map<string, number>();

    for (const tradingPair of tradingPairs) {
        const tokenTradeName1 = tradingPair.tokenTradeName1;
        const tokenTradeName2 = tradingPair.tokenTradeName2;

        if (!tokenTradeName1 || !tokenTradeName2) {
            continue
        }

        const token1 = await findTokenBySymbol(tokenTradeName1, mainApp.getDataSource());
        const token2 = await findTokenBySymbol(tokenTradeName2, mainApp.getDataSource());

        if (!token1 || !token2) {
            continue
        }

        pairAndPrice.set(tokenTradeName1 + "-" + tokenTradeName2, await getPrice(mainApp, token1, token2));
    }

    return pairAndPrice;
}

export async function getPrice(mainApp: MainApp, token1: Token, token2: Token) {
    if (!token1?.policyId || !token1?.tokenName || !token1?.getContractName()) {
        throw new Error('Token not found');
    }

    const lpUTxO1 = await Exchange.getLiquidityPoolUTxO(
        mainApp.getLucid(),
        ADMIN_PUBLIC_KEY_HASH,
        {
            policyId: token1.policyId,
            tokenName: token1.tokenName
        }
    );

    if (token2.tradeName == "ADA") {
        return Number(lpUTxO1.assets[token1.getContractName()]) / Number(lpUTxO1.assets['lovelace']);
    } else {
        if (!token2?.policyId || !token2?.tokenName || !token2?.getContractName()) {
            throw new Error('Token not found');
        }

        const lpUTxO2 = await Exchange.getLiquidityPoolUTxO(
            mainApp.getLucid(),
            ADMIN_PUBLIC_KEY_HASH,
            {
                policyId: token2.policyId,
                tokenName: token2.tokenName
            }
        );

        return Number(lpUTxO1.assets[token1.getContractName()] * lpUTxO2.assets['lovelace'] / (lpUTxO1.assets['lovelace'] * lpUTxO2.assets[token2.getContractName()]));
    }
}

export function isValidPolicyId(policyId: string): boolean {
    const policyIdRegex = /^[0-9a-fA-F]{56}$/;
    return policyIdRegex.test(policyId);
}
