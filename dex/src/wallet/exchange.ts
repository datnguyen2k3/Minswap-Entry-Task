import {
    getLiquidityPoolUTxO,
    getMintAuthValidator,
    getMintExchangeValidator,
    MIN_TOKEN_NAME,
    MIN_TOKEN_POLICY_ID
} from "./admin-functions";
import {Constr, Data, fromText, LucidEvolution, Redeemer, UTxO} from "@lucid-evolution/lucid";
import {getPrivateKey, getPrivateKeyFrom, submitTx, toObject} from "../../../hello-world/common";
import {
    AUTH_TOKEN_NAME,
    INIT_LP_TOKEN_AMOUNT,
    LiquidityPoolInfoScheme,
    LP_TOKEN_NAME, MintValidators,
    PRIVATE_KEY_PATH
} from "../types";
import {getLucidOgmiosInstance} from "../../../src/lucid-instance";
import {validateAddedLiquidity} from "../utils";

class Exchange {
    private readonly lucid: LucidEvolution;
    private readonly mintExchangeValidator: MintValidators;
    private readonly mintAuthValidator: MintValidators;
    private readonly tradeAssetName: string;
    private readonly lpAssetName: string;
    private readonly authAssetName: string;
    public static readonly ADD_REDEEMER: Redeemer = Data.to(new Constr(0, []));

    constructor(lucid: LucidEvolution, mintExchangeValidator: MintValidators, mintAuthValidator: MintValidators) {
        this.lucid = lucid;
        this.mintExchangeValidator = mintExchangeValidator;
        this.mintAuthValidator = mintAuthValidator;
        this.tradeAssetName = `${MIN_TOKEN_POLICY_ID}${fromText(MIN_TOKEN_NAME)}`;
        this.lpAssetName = `${mintExchangeValidator.policyId}${fromText(LP_TOKEN_NAME)}`;
        this.authAssetName = `${mintAuthValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;
    }

    public static async getInstance(privateKey: string) {
        const lucid = await getLucidOgmiosInstance();
        lucid.selectWallet.fromPrivateKey(privateKey);

        const mintExchangeValidator = await getMintExchangeValidator(lucid);
        const mintAuthValidator = await getMintAuthValidator(lucid);

        return new Exchange(lucid, mintExchangeValidator, mintAuthValidator);
    }

    public static async getTotalSupply(lpUTxO: UTxO) {
        const lpInfo = toObject(lpUTxO.datum, LiquidityPoolInfoScheme);
        return lpInfo.total_supply;
    }


    public async addLiquidity(addedLovelace: bigint) {
        const lpUTxO = await getLiquidityPoolUTxO(this.lucid);
        const lpTokenSupply = await Exchange.getTotalSupply(lpUTxO);

        if (lpTokenSupply === BigInt(0)) {
            await this.handleFirstTimeAddedLiquidity(addedLovelace, lpUTxO);
        } else {
            const reservedLovelace = lpUTxO.assets["lovelace"];
            const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

            const addedTradeToken = BigInt(addedLovelace) * BigInt(reservedTradeToken) / reservedLovelace;
            console.log("Added trade token:", addedTradeToken);

            const isValidAddedTradeToken = validateAddedLiquidity(
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
                this.lucid,
                await this.lucid.wallet().getUtxos(),
                lpUTxO,
                addedLovelace,
                addedTradeToken,
                receivedLpToken
            )
        }
    }

    private async handleFirstTimeAddedLiquidity(addedLovelace: bigint, lpUTxO: UTxO) {
        const addedTradeToken = BigInt(100000);

        await this.submitAddedLiquidity(
            this.lucid,
            await this.lucid.wallet().getUtxos(),
            lpUTxO,
            addedLovelace,
            addedTradeToken,
            BigInt(INIT_LP_TOKEN_AMOUNT)
        )
    }

    private async submitAddedLiquidity(
        lucid: LucidEvolution,
        userUTxOs: UTxO[],
        lpUTxO: UTxO,
        addedLovelace: bigint,
        addedTradeToken: bigint,
        receivedLpToken: bigint
    ) {
        const inputUTxOs = userUTxOs.concat([lpUTxO]);

        const reservedLovelace = lpUTxO.assets["lovelace"] || BigInt(0);
        const reservedTradeToken = lpUTxO.assets[this.tradeAssetName] || BigInt(0);

        const lpTokenSupply = await Exchange.getTotalSupply(lpUTxO);

        const tx = await lucid
                .newTx()
                .collectFrom(inputUTxOs, Exchange.ADD_REDEEMER)
                .attach.MintingPolicy(this.mintExchangeValidator.policyScripts)
                .attach.SpendingValidator(this.mintExchangeValidator.policyScripts)
                .mintAssets(
                    {[this.lpAssetName]: receivedLpToken},
                    Exchange.ADD_REDEEMER
                )
                .pay.ToContract(
                    this.mintExchangeValidator.lockAddress,
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
}

Exchange.getInstance(getPrivateKeyFrom(PRIVATE_KEY_PATH)).then(async exchange => {
    await exchange.addLiquidity(BigInt(10000000));
})
