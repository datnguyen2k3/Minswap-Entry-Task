import {Constr, Data, fromText, LucidEvolution, Redeemer, UTxO} from "@lucid-evolution/lucid";
import {getPrivateKeyFrom, getPublicKeyHash, submitTx, toObject} from "../../../hello-world/common";
import {
    Asset,
    AUTH_TOKEN_NAME,
    INIT_LP_TOKEN_AMOUNT,
    LIQUIDITY_POOL_INFO_SCHEME,
    LP_TOKEN_NAME,
    MIN_TOKEN_NAME,
    MIN_TOKEN_POLICY_ID,
    PRIVATE_KEY_PATH_TEST,
    Validators
} from "../types";
import {getLucidOgmiosInstance} from "../../../src/lucid-instance";
import {getAuthValidator, getExchangeValidator, isEqualRational} from "../utils";
import {AuthenMintingPolicy} from "./authen-minting-policy";
import {SIMPLE} from "cbor/types/lib/constants";

class Exchange {
    private readonly lucid: LucidEvolution | undefined;
    private readonly privateKey: string;
    private readonly exchangeValidator: Validators;
    private readonly authValidator: Validators;
    private readonly tradeAsset: Asset;
    private readonly tradeAssetName: string;
    private readonly lpAssetName: string;
    private readonly authAssetName: string;
    private readonly adminPublicKeyHash: string;

    public static readonly ADD_REDEEMER: Redeemer = Data.to(new Constr(0, []));
    public static readonly REMOVE_REDEEMER: Redeemer = Data.to(new Constr(1, []));
    public static readonly SWAP_TO_ADA_REDEEMER: Redeemer = Data.to(new Constr(2, []));
    public static readonly SWAP_TO_TOKEN_REDEEMER: Redeemer = Data.to(new Constr(3, []));

    constructor(privateKey: string, adminPublicKeyHash: string, tradeAsset: Asset) {
        this.privateKey = privateKey;
        this.exchangeValidator = getExchangeValidator(adminPublicKeyHash, tradeAsset);
        this.authValidator = getAuthValidator(adminPublicKeyHash);
        this.adminPublicKeyHash = adminPublicKeyHash;
        this.tradeAsset = tradeAsset;
        this.tradeAssetName = `${tradeAsset.policyId}${fromText(tradeAsset.tokenName)}`;
        this.lpAssetName = `${this.exchangeValidator.policyId}${fromText(LP_TOKEN_NAME)}`;
        this.authAssetName = `${this.authValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;
    }

    public static getTotalSupply(lpUTxO: UTxO) {
        const lpInfo = toObject(lpUTxO.datum, LIQUIDITY_POOL_INFO_SCHEME);
        return lpInfo.total_supply;
    }

    public static async getLiquidityPoolUTxO(lucid: LucidEvolution, adminPublicKeyHash: string, tradeAsset: Asset) {
        const mintAuthValidators = getAuthValidator(adminPublicKeyHash);
        const mintExchangeValidator = getExchangeValidator(adminPublicKeyHash, tradeAsset);

        const authAssetName = `${mintAuthValidators.policyId}${fromText(AUTH_TOKEN_NAME)}`;

        const utxos = await lucid.utxosAt(mintExchangeValidator.lockAddress);
        for (const utxo of utxos) {
            if (utxo.datum && utxo.assets[authAssetName] === BigInt(1)) {
                // console.log("Liquidity pool UTxO:", utxo);
                const lpInfo = toObject(utxo.datum, LIQUIDITY_POOL_INFO_SCHEME);
                // console.log("Liquidity pool info:", lpInfo);
                return utxo;
            }
        }

        throw new Error("Liquidity pool UTxO not found");
    }

    public static getReceivedLovelaceBySwapTradeToken(lpUTxO: UTxO, tradeTokenAmount: bigint, tradeTokenName: string) {
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[tradeTokenName] || BigInt(0);

        return tradeTokenAmount * reservedLovelace * BigInt(1000) / ((reservedTradeToken + tradeTokenAmount) * BigInt(997));
    }

    public static getReceivedTradeTokenBySwapAda(lpUTxO: UTxO, lovelaceAmount: bigint, tradeTokenName: string) {
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[tradeTokenName] || BigInt(0);

        return lovelaceAmount * reservedTradeToken * BigInt(1000) / ((reservedLovelace + lovelaceAmount) * BigInt(997));
    }

    public static getAddedAdaByAddedTradeToken(lpUTxO: UTxO, tradeTokenAmount: bigint, tradeTokenName: string) {
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[tradeTokenName] || BigInt(0);

        return tradeTokenAmount * reservedLovelace / reservedTradeToken;
    }

    public static getAddedTradeTokenByAddedAda(lpUTxO: UTxO, lovelaceAmount: bigint, tradeTokenName: string) {
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[tradeTokenName] || BigInt(0);

        return lovelaceAmount * reservedTradeToken / reservedLovelace;
    }

    public static getLpTokenByAddedLiquidity(lpUTxO: UTxO, addedLovelace: bigint, addedTradeToken: bigint, tradeTokenName: string) {
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[tradeTokenName] || BigInt(0);
        const totalSupply = Exchange.getTotalSupply(lpUTxO);

        if (totalSupply === BigInt(0)) {
            if (addedLovelace === BigInt(0) || addedTradeToken === BigInt(0)) {
                throw new Error("Added liquidity for first time must be greater than 0");
            }

            return BigInt(INIT_LP_TOKEN_AMOUNT);
        }

        return BigInt(Math.min(
            Number(addedLovelace * totalSupply / reservedLovelace),
            Number(addedTradeToken * totalSupply / reservedTradeToken)
        ))
    }

    public static getRemovedLoveLaceByRemovedLpToken(lpUTxO: UTxO, burnedLpToken: bigint) {
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const totalSupply = Exchange.getTotalSupply(lpUTxO);

        const removedLovelace =  burnedLpToken * reservedLovelace / totalSupply;

        if (!isEqualRational(removedLovelace, reservedLovelace, burnedLpToken, totalSupply)) {
            throw new Error("LP token is not enough to burned");
        }

        return removedLovelace;
    }

    public static getRemovedTradeTokenByRemovedLpToken(lpUTxO: UTxO, burnedLpToken: bigint, tradeTokenName: string) {
        const reservedTradeToken = lpUTxO.assets[tradeTokenName] || BigInt(0);
        const totalSupply = Exchange.getTotalSupply(lpUTxO);

        const removedTradeToken = burnedLpToken * reservedTradeToken / totalSupply;

        if (!isEqualRational(removedTradeToken, reservedTradeToken, burnedLpToken, totalSupply)) {
            throw new Error("LP token is not enough to burned");
        }

        return removedTradeToken;
    }

    public static validateAddedLiquidity(lpUTxO: UTxO, addedLovelace: bigint, addedTradeToken: bigint, tradeTokenName: string) {
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[tradeTokenName] || BigInt(0);

        return isEqualRational(
            addedTradeToken,
            addedLovelace,
            reservedTradeToken,
            reservedLovelace,
        )
    }

    private async getLucid() {
        if (this.lucid) {
            return this.lucid;
        }

        const lucid = await getLucidOgmiosInstance();
        lucid.selectWallet.fromPrivateKey(this.privateKey);
        return lucid
    }

    public async createAddedLiquidityTx(lpUTxO: UTxO, addedLovelace: bigint, addedTradeToken: bigint, receivedLpToken: bigint) {
        const lucid = await this.getLucid();
        const inputUTxOs = await lucid.wallet().getUtxos();
        inputUTxOs.push(lpUTxO);

        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

        const lpTokenSupply = Exchange.getTotalSupply(lpUTxO);

        return await lucid
            .newTx()
            .collectFrom(inputUTxOs, Exchange.ADD_REDEEMER)
            .attach.MintingPolicy(this.exchangeValidator.policyScripts)
            .attach.SpendingValidator(this.exchangeValidator.policyScripts)
            .mintAssets(
                {[this.lpAssetName]: receivedLpToken},
                Exchange.ADD_REDEEMER
            )
            .pay.ToContract(
                this.exchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(lpTokenSupply) + receivedLpToken]))
                }, {
                    [this.authAssetName]: BigInt(1),
                    [this.tradeAssetName]: BigInt(reservedTradeToken) + BigInt(addedTradeToken),
                    "lovelace": reservedLovelace + addedLovelace
                }
            )
            .complete();
    }

    public async createRemoveLiquidityTx(lpUTxO: UTxO, burnedLpToken: bigint, removedLovelace: bigint, removedTradeToken: bigint) {
        const lucid = await this.getLucid();

        const lpTokenSupply = Exchange.getTotalSupply(lpUTxO);
        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

        const inputUTxOs = await lucid.wallet().getUtxos();
        inputUTxOs.push(lpUTxO);

        return await lucid
            .newTx()
            .collectFrom(inputUTxOs, Exchange.REMOVE_REDEEMER)
            .attach.MintingPolicy(this.exchangeValidator.policyScripts)
            .attach.SpendingValidator(this.exchangeValidator.policyScripts)
            .mintAssets(
                {[this.lpAssetName]: -burnedLpToken},
                Exchange.REMOVE_REDEEMER
            )
            .pay.ToContract(
                this.exchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(lpTokenSupply) - burnedLpToken]))
                }, {
                    lovelace: reservedLovelace - removedLovelace,
                    [this.authAssetName]: BigInt(1),
                    [this.tradeAssetName]: reservedTradeToken - removedTradeToken
                }
            )
            .pay.ToAddress(
                await lucid.wallet().address(),
                {
                    lovelace: removedLovelace,
                    [this.tradeAssetName]: removedTradeToken
                }
            )
            .complete();
    }

    private async handleFirstTimeAddedLiquidity(addedLovelace: bigint, lpUTxO: UTxO) {
        const addedTradeToken = BigInt(100000);

        await this.submitAddedLiquidity(
            lpUTxO,
            addedLovelace,
            addedTradeToken,
            BigInt(INIT_LP_TOKEN_AMOUNT)
        )
    }

    private async submitAddedLiquidity(lpUTxO: UTxO, addedLovelace: bigint, addedTradeToken: bigint, receivedLpToken: bigint) {
        const lucid = await this.getLucid();
        const inputUTxOs = await lucid.wallet().getUtxos();
        inputUTxOs.push(lpUTxO);

        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

        const lpTokenSupply = Exchange.getTotalSupply(lpUTxO);

        const tx = await lucid
            .newTx()
            .collectFrom(inputUTxOs, Exchange.ADD_REDEEMER)
            .attach.MintingPolicy(this.exchangeValidator.policyScripts)
            .attach.SpendingValidator(this.exchangeValidator.policyScripts)
            .mintAssets(
                {[this.lpAssetName]: receivedLpToken},
                Exchange.ADD_REDEEMER
            )
            .pay.ToContract(
                this.exchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(lpTokenSupply) + receivedLpToken]))
                }, {
                    [this.authAssetName]: BigInt(1),
                    [this.tradeAssetName]: BigInt(reservedTradeToken) + BigInt(addedTradeToken),
                    "lovelace": reservedLovelace + addedLovelace
                }
            )
            .complete();

        await submitTx(tx, lucid);
    }

    public async addLiquidity(addedLovelace: bigint) {
        const lucid = await this.getLucid();
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(lucid, this.adminPublicKeyHash, this.tradeAsset);
        const lpTokenSupply = Exchange.getTotalSupply(lpUTxO);

        if (lpTokenSupply === BigInt(0)) {
            await this.handleFirstTimeAddedLiquidity(addedLovelace, lpUTxO);
        } else {
            const reservedLovelace = lpUTxO.assets["lovelace"];
            const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

            const addedTradeToken = BigInt(addedLovelace) * BigInt(reservedTradeToken) / reservedLovelace;
            console.log("Added trade token:", addedTradeToken);

            const isValidAddedTradeToken = isEqualRational(
                addedTradeToken,
                addedLovelace,
                reservedTradeToken,
                reservedLovelace,
            )

            if (!isValidAddedTradeToken) {
                throw new Error("Invalid added liquidity");
            }

            const receivedLpToken = BigInt(addedLovelace) * lpTokenSupply / reservedLovelace;
            console.log("Received LP token:", receivedLpToken);

            await this.submitAddedLiquidity(
                lpUTxO,
                addedLovelace,
                addedTradeToken,
                receivedLpToken
            )
        }
    }

    public async removeLiquidity(burnedLpToken: bigint) {
        console.log("Burned LP token:", burnedLpToken);
        const lucid = await this.getLucid();
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(lucid, this.adminPublicKeyHash, this.tradeAsset);
        const lpTokenSupply = Exchange.getTotalSupply(lpUTxO);

        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

        const removedLovelace = BigInt(burnedLpToken) * reservedLovelace / lpTokenSupply;
        console.log("Received lovelace:", removedLovelace);
        const removedTradeToken = BigInt(burnedLpToken) * reservedTradeToken / lpTokenSupply;
        console.log("Received trade token:", removedTradeToken);

        if (!isEqualRational(removedLovelace, reservedLovelace, burnedLpToken, lpTokenSupply)) {
            throw new Error("Invalid removed lovelace");
        }

        if (!isEqualRational(removedTradeToken, reservedTradeToken, burnedLpToken, lpTokenSupply)) {
            throw new Error("Invalid removed trade token");
        }

        const inputUTxOs = await lucid.wallet().getUtxos();
        inputUTxOs.push(lpUTxO);

        const tx = await lucid
            .newTx()
            .collectFrom(inputUTxOs, Exchange.REMOVE_REDEEMER)
            .attach.MintingPolicy(this.exchangeValidator.policyScripts)
            .attach.SpendingValidator(this.exchangeValidator.policyScripts)
            .mintAssets(
                {[this.lpAssetName]: -burnedLpToken},
                Exchange.REMOVE_REDEEMER
            )
            .pay.ToContract(
                this.exchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(lpTokenSupply) - burnedLpToken]))
                }, {
                    lovelace: reservedLovelace - removedLovelace,
                    [this.authAssetName]: BigInt(1),
                    [this.tradeAssetName]: reservedTradeToken - removedTradeToken
                }
            )
            .pay.ToAddress(
                await lucid.wallet().address(),
                {
                    lovelace: removedLovelace,
                    [this.tradeAssetName]: removedTradeToken
                }
            )
            .complete();

        await submitTx(tx, lucid);
    }

    public async swapTradeTokenToAda(swappedTradeToken: bigint) {
        console.log("Swapped trade token:", swappedTradeToken);
        const lucid = await this.getLucid();
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(lucid, this.adminPublicKeyHash, this.tradeAsset);
        const lpTokenSupply = Exchange.getTotalSupply(lpUTxO);

        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

        const receivedLovelace = Exchange.getReceivedLovelaceBySwapTradeToken(lpUTxO, swappedTradeToken, this.tradeAssetName);
        console.log("Received lovelace:", receivedLovelace);

        const inputUTxOs = await lucid.wallet().getUtxos();
        inputUTxOs.push(lpUTxO);

        const tx = await lucid
            .newTx()
            .collectFrom(inputUTxOs, Exchange.SWAP_TO_ADA_REDEEMER)
            .attach.SpendingValidator(this.exchangeValidator.policyScripts)
            .pay.ToContract(
                this.exchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(lpTokenSupply)]))
                }, {
                    lovelace: reservedLovelace - receivedLovelace,
                    [this.authAssetName]: BigInt(1),
                    [this.tradeAssetName]: reservedTradeToken + swappedTradeToken
                }
            )
            .pay.ToAddress(
                await lucid.wallet().address(),
                {
                    lovelace: receivedLovelace
                }
            )
            .complete();

        await submitTx(tx, lucid);
    }

    public async swapAdaToTradeToken(swappedLovelace: bigint) {
        console.log("Swapped lovelace:", swappedLovelace);
        const lucid = await this.getLucid();
        const lpUTxO = await Exchange.getLiquidityPoolUTxO(lucid, this.adminPublicKeyHash, this.tradeAsset);
        const lpTokenSupply = Exchange.getTotalSupply(lpUTxO);

        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

        const receivedTradeToken = Exchange.getReceivedTradeTokenBySwapAda(lpUTxO, swappedLovelace, this.tradeAssetName);
        console.log("Received trade token:", receivedTradeToken);

        const inputUTxOs = await lucid.wallet().getUtxos();
        inputUTxOs.push(lpUTxO);

        const tx = await lucid
            .newTx()
            .collectFrom(inputUTxOs, Exchange.SWAP_TO_TOKEN_REDEEMER)
            .attach.SpendingValidator(this.exchangeValidator.policyScripts)
            .pay.ToContract(
                this.exchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(lpTokenSupply)]))
                }, {
                    lovelace: reservedLovelace + swappedLovelace,
                    [this.authAssetName]: BigInt(1),
                    [this.tradeAssetName]: reservedTradeToken - receivedTradeToken
                }
            )
            .pay.ToAddress(
                await lucid.wallet().address(),
                {
                    [this.tradeAssetName]: receivedTradeToken
                }
            )
            .complete();

        await submitTx(tx, lucid);
    }

    public async swapTradeTokenToOtherToken(swappedTradeToken: bigint, otherAsset: Asset) {
        console.log("Swapped trade token:", swappedTradeToken);
        const lucid = await this.getLucid();
        const tradeTokenLpUTxO = await Exchange.getLiquidityPoolUTxO(lucid, this.adminPublicKeyHash, this.tradeAsset);
        const swappedLovelace = Exchange.getReceivedLovelaceBySwapTradeToken(tradeTokenLpUTxO, swappedTradeToken, this.tradeAssetName);

        const otherAssetName = `${otherAsset.policyId}${fromText(otherAsset.tokenName)}`;
        const otherExchangeLpUTxO = await Exchange.getLiquidityPoolUTxO(lucid, this.adminPublicKeyHash, otherAsset);
        const receivedOtherToken = Exchange.getReceivedTradeTokenBySwapAda(otherExchangeLpUTxO, swappedLovelace, otherAssetName);
        console.log("Received other token:", receivedOtherToken);

        const otherExchangeValidator = getExchangeValidator(this.adminPublicKeyHash, otherAsset);

        const inputUTxOs = await lucid.wallet().getUtxos();

        const tx = await lucid
            .newTx()
            .collectFrom(inputUTxOs.concat(tradeTokenLpUTxO), Exchange.SWAP_TO_ADA_REDEEMER)
            .collectFrom([otherExchangeLpUTxO], Exchange.SWAP_TO_TOKEN_REDEEMER)
            .attach.SpendingValidator(this.exchangeValidator.policyScripts)
            .attach.SpendingValidator(otherExchangeValidator.policyScripts)
            .pay.ToContract(
                this.exchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(Exchange.getTotalSupply(tradeTokenLpUTxO))]))
                }, {
                    [this.authAssetName]: BigInt(1),
                    lovelace: tradeTokenLpUTxO.assets["lovelace"] - swappedLovelace,
                    [this.tradeAssetName]: tradeTokenLpUTxO.assets[this.tradeAssetName] + swappedTradeToken,
                }
            )
            .pay.ToContract(
                otherExchangeValidator.lockAddress,
                {
                    kind: 'inline',
                    value: Data.to(new Constr(0, [BigInt(Exchange.getTotalSupply(otherExchangeLpUTxO))]))
                }, {
                    [this.authAssetName]: BigInt(1),
                    lovelace: otherExchangeLpUTxO.assets["lovelace"] + swappedLovelace,
                    [otherAssetName]: otherExchangeLpUTxO.assets[otherAssetName] - receivedOtherToken,
                }
            )
            .complete();

        await submitTx(tx, lucid);
    }
}

function main() {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH_TEST);

    const minAsset: Asset = {
        policyId: MIN_TOKEN_POLICY_ID,
        tokenName: MIN_TOKEN_NAME
    }

    const trashAsset: Asset = {
        policyId: "0f6b02150cbcc7fedafa388abcc41635a9443afb860100099ba40f07",
        tokenName: "TRASH_TOKEN"
    }

    const minExchange = new Exchange(
        privateKey,
        getPublicKeyHash(privateKey),
        minAsset
    )

    const trashExchange = new Exchange(
        privateKey,
        getPublicKeyHash(privateKey),
        trashAsset
    )

    const authenMintingPolicy = new AuthenMintingPolicy(privateKey);

    // mintTrashToken(getPrivateKeyFrom(PRIVATE_KEY_PATH)).then(() => console.log("Mint Trash Token successfully!"));

    // authenMintingPolicy.createLiquidityPoolUTxO(minAsset).then(() => console.log("Liquidity pool created successfully for min token"));
    // authenMintingPolicy.createLiquidityPoolUTxO(trashAsset).then(() => console.log("Liquidity pool created successfully for trash token"));

    // minExchange.addLiquidity(BigInt(15550000)).then(() => console.log("Liquidity added successfully for min token"));
    // minExchange.removeLiquidity(BigInt(103400)).then(() => console.log("Liquidity removed successfully for min token"));
    // minExchange.swapTradeTokenToAda(BigInt(50000)).then(() => console.log("Trade token swapped to Ada successfully for min token"));
    // minExchange.swapAdaToTradeToken(BigInt(103201)).then(() => console.log("Ada swapped to trade token successfully for min token"));

    // trashExchange.addLiquidity(BigInt(1555000)).then(() => console.log("Liquidity added successfully for trash token"));
    // trashExchange.removeLiquidity(BigInt(103400)).then(() => console.log("Liquidity removed successfully for trash token"));
    // trashExchange.swapTradeTokenToAda(BigInt(50000)).then(() => console.log("Trade token swapped to Ada successfully for trash token"));
    // trashExchange.swapAdaToTradeToken(BigInt(103201)).then(() => console.log("Ada swapped to trade token successfully for trash token"));

    // minExchange.swapTradeTokenToOtherToken(BigInt(50000), trashAsset).then(() => console.log("Trade token swapped to other token successfully for min token"));
}

main();
