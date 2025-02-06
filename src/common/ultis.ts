import {CML, fromText, toText, TxSignBuilder, UTxO} from "@lucid-evolution/lucid";
import {MainApp} from "../main";
import sha256 from 'crypto-js/sha256';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import Base64 from 'crypto-js/enc-base64';

import {findTokenByPolicyIdAndTokenName, findTokenBySymbol, saveToken} from "../repository/token-repository";
import {Exchange} from "../../dex/src/dex/exchange";
import {ADA_TO_LOVELACE, PASSWORD_PATH} from "./types";
import {findPairByTokenSymbol} from "../repository/trading-pair-repository";
import {saveKeyFrom} from "../../hello-world/common";
import {Token} from "../entities/token";
import {getExchangeValidator} from "../../dex/src/utils";

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

export async function getAssets(address: string, mainApp: MainApp) {
    const utxos = await mainApp.getLucid().utxosAt(address);
    const assets = new Map<string, number>();
    const tokenSymbolsMap = new Map<string, string>();

    for (const utxo of utxos) {
        for (const assetName in utxo.assets) {
            const value = utxo.assets[assetName as keyof typeof utxo.assets]
            if (assetName === 'lovelace') {
                assets.set(
                    'ADA',
                    (assets.get('ADA') || 0) + Number(value) / ADA_TO_LOVELACE
                )
                continue;
            }

            let tokenSymbol = tokenSymbolsMap.get(assetName);

            if (!tokenSymbol) {
                const policyId = assetName.substring(0, 56);
                const tokenName = toText(assetName.substring(56));

                const token = await findTokenByPolicyIdAndTokenName(policyId, tokenName, mainApp.getDataSource());
                if (token && token.tradeName) {
                    tokenSymbol = token.tradeName;
                    tokenSymbolsMap.set(assetName, tokenSymbol);
                }
            }

            if (!tokenSymbol) {
                assets.set(
                    assetName,
                    (assets.get(assetName) || 0) + Number(value)
                )
            } else {
                assets.set(
                    tokenSymbol,
                    (assets.get(tokenSymbol) || 0) + Number(value)
                )
            }
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

export async function getReceivedTokenFrom(sentTokenSymbol: string, sentAmount: number, receivedTokenSymbol: string, mainApp: MainApp) {
    if (receivedTokenSymbol === 'ADA') {
        const sentToken = await findTokenBySymbol(sentTokenSymbol, mainApp.getDataSource());
        if (!sentToken) {
            throw new Error('Token not found');
        }
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), sentToken.getAsset());
        return Number(Exchange.getReceivedLovelaceBySwapTradeToken(lpUTxO, BigInt(sentAmount), sentToken.getContractName())) / ADA_TO_LOVELACE;
    } else if (sentTokenSymbol === 'ADA') {
        const receivedToken = await findTokenBySymbol(receivedTokenSymbol, mainApp.getDataSource());
        if (!receivedToken) {
            throw new Error('Token not found');
        }
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), receivedToken.getAsset());
        return Number(Exchange.getReceivedTradeTokenBySwapAda(lpUTxO, BigInt(sentAmount * ADA_TO_LOVELACE), receivedToken.getContractName()));
    } else {
        const sentToken = await findTokenBySymbol(sentTokenSymbol, mainApp.getDataSource());
        const receivedToken = await findTokenBySymbol(receivedTokenSymbol, mainApp.getDataSource());
        if (!sentToken || !receivedToken) {
            throw new Error('Token not found');
        }

        const sentLpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), sentToken.getAsset());
        const receivedLpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), receivedToken.getAsset());

        const bridgeLovelace = Exchange.getReceivedLovelaceBySwapTradeToken(sentLpUTxO, BigInt(sentAmount), sentToken.getContractName());
        return Number(Exchange.getReceivedTradeTokenBySwapAda(receivedLpUTxO, BigInt(bridgeLovelace), receivedToken.getContractName()));
    }
}

export async function createSwapTx(mainApp: MainApp, sentTokenSymbol: string, receivedTokenSymbol: string, sentAmount: number, receiveAmount: number) {
    const pair = await findPairByTokenSymbol(sentTokenSymbol, receivedTokenSymbol, mainApp.getDataSource());
    if (!pair) {
        throw new Error('Trading pair not found');
    }

    if (sentTokenSymbol === 'ADA') {
        const token = await findTokenBySymbol(receivedTokenSymbol, mainApp.getDataSource());
        if (!token) {
            throw new Error('Token not found');
        }

        const exchange = new Exchange(mainApp.getLucid(), mainApp.getPrivateKey(), mainApp.getAdminPublicKeyHash(), token.getAsset());
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), token.getAsset());
        return await exchange.createSwapAdaToTradeTokenTx(lpUTxO, BigInt(sentAmount * ADA_TO_LOVELACE), BigInt(receiveAmount));
    } else if (receivedTokenSymbol === 'ADA') {
        const token = await findTokenBySymbol(sentTokenSymbol, mainApp.getDataSource());
        if (!token) {
            throw new Error('Token not found');
        }

        const exchange = new Exchange(mainApp.getLucid(), mainApp.getPrivateKey(), mainApp.getAdminPublicKeyHash(), token.getAsset());
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), token.getAsset());
        return await exchange.createSwapTradeTokenToAdaTx(lpUTxO, BigInt(sentAmount), BigInt(receiveAmount * ADA_TO_LOVELACE));
    } else {
        const sentToken = await findTokenBySymbol(sentTokenSymbol, mainApp.getDataSource());
        const receivedToken = await findTokenBySymbol(receivedTokenSymbol, mainApp.getDataSource());
        if (!sentToken || !receivedToken) {
            throw new Error('Token not found');
        }

        const exchange = new Exchange(mainApp.getLucid(), mainApp.getPrivateKey(), mainApp.getAdminPublicKeyHash(), sentToken.getAsset());
        const sentLpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), sentToken.getAsset());
        const receivedLpUTxO = await Exchange.getLiquidityPoolUTxO(mainApp.getLucid(), mainApp.getAdminPublicKeyHash(), receivedToken.getAsset());
        return await exchange.createSwapTradeTokenToOtherTokenTx(sentLpUTxO, receivedLpUTxO, BigInt(sentAmount), BigInt(receiveAmount), receivedToken.getAsset());
    }
}

export function getFee(tx: TxSignBuilder): number {
    return Number(tx.toTransaction().body().fee()) / ADA_TO_LOVELACE;
}

export function isValidPolicyId(policyId: string): boolean {
    const policyIdRegex = /^[0-9a-fA-F]{56}$/;
    return policyIdRegex.test(policyId);
}

export function isValidAddress(address: string): boolean {
    try {
        CML.Address.from_bech32(address);
        return true;
    } catch (e) {
        return false;
    }
}

export function createEncryptedPassword(password: string, privateKey: string): string {
    const hashDigest = sha256(password);
    return Base64.stringify(hmacSHA512(hashDigest, privateKey));
}

export function savePassword(password: string, privateKey: string) {
    const encryptedPassword = createEncryptedPassword(password, privateKey);
    saveKeyFrom(encryptedPassword, PASSWORD_PATH);
}

export function getAddedAdaByAddLiquidity(lpUTxO: UTxO, tokenAmount: number, tokenContractName: string): number {
    const amount = Number(Exchange.getAddedAdaByAddedTradeToken(lpUTxO, BigInt(tokenAmount), tokenContractName));
    return amount / ADA_TO_LOVELACE;
}

export function getLpContractName(token: Token, adminPublishKeyHash: string): string {
    const validator = getExchangeValidator(adminPublishKeyHash, token.getAsset());
    if (!token.tokenName) {
        throw new Error('Token name not found');
    }
    return `${validator.policyId}${fromText(token.tokenName)}`
}

export function getLpTokenAmount(lpUTxO: UTxO, tokenAmount: number, adaAmount: number, tokenContractName: string): number {
    return Number(Exchange.getLpTokenByAddedLiquidity(
        lpUTxO,
        BigInt(tokenAmount),
        BigInt(adaAmount * ADA_TO_LOVELACE),
        tokenContractName
    ))
}

export function createAddLiquidityTx(lpUTxO: UTxO, mainApp: MainApp, token: Token, tokenAmount: number, adaAmount: number, lpAmount: number) {
    const lovelaceAmount = BigInt(adaAmount * ADA_TO_LOVELACE);
    const exchange = new Exchange(mainApp.getLucid(), mainApp.getPrivateKey(), mainApp.getAdminPublicKeyHash(), token.getAsset());
    return exchange.createAddedLiquidityTx(lpUTxO, lovelaceAmount, BigInt(tokenAmount), BigInt(lpAmount));
}

export function saveLpToken(token: Token, mainApp: MainApp) {
    const tradeName = `${token.tradeName}-ADA`;
    const validator = getExchangeValidator(mainApp.getAdminPublicKeyHash(), token.getAsset());
    const policyId = validator.policyId;
    const tokenName = 'LP_TOKEN';
    return saveToken(policyId, tokenName, tradeName, mainApp.getDataSource());
}
