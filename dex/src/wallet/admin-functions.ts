import {readMintValidators} from "../utils";
import {AUTH_TOKEN_NAME, LiquidityPoolInfoScheme, MintValidators, PLUTUS_PATH, PRIVATE_KEY_PATH} from "../types";
import {Constr, Data, fromText, LucidEvolution} from "@lucid-evolution/lucid";
import {getLucidOgmiosInstance} from "../../../src/lucid-instance";
import {getPrivateKeyFrom, getPublicKeyHash, submitTx, toObject} from "../../../hello-world/common";

const MINT_AUTH_TOKEN_TITLE = "authen_minting_policy.authen_minting_policy.mint";
const MINT_EXCHANGE_TITLE = "exchange.exchange.mint";

export const MIN_TOKEN_POLICY_ID = "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72";
export const MIN_TOKEN_NAME = "MIN";

export async function getMintAuthValidator(lucid: LucidEvolution) : Promise<MintValidators>{
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)
    const publicKeyHash = await getPublicKeyHash(privateKey, lucid);
    return readMintValidators(
        MINT_AUTH_TOKEN_TITLE,
        PLUTUS_PATH,
        [publicKeyHash]
    );
}

export async function getMintExchangeValidator(lucid: LucidEvolution) : Promise<MintValidators>{
    const mintAuthValidators = await getMintAuthValidator(lucid);

    const tradeTokenAsset = new Constr(0, [
        MIN_TOKEN_POLICY_ID,
        fromText(MIN_TOKEN_NAME)
    ]);

    const authTokenAsset = new Constr(0, [
        mintAuthValidators.policyId,
        fromText(AUTH_TOKEN_NAME)
    ]);

    return readMintValidators(
        MINT_EXCHANGE_TITLE,
        PLUTUS_PATH,
        [tradeTokenAsset, authTokenAsset]
    );
}

export async function mintAuthToken() {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const mintAuthValidator = await getMintAuthValidator(lucid)
    const authAssetName = `${mintAuthValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;
    const mintRedeemer = Data.to(new Constr(0, []));



    const tx = await lucid
        .newTx()
        .attach.MintingPolicy(mintAuthValidator.policyScripts)
        .mintAssets({[authAssetName]: BigInt(1)}, mintRedeemer)
        .complete();

    await submitTx(tx, lucid);
}

export async function createLiquidityPoolUTxO() {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const mintAuthTokenValidator = await getMintAuthValidator(lucid)
    const mintExchangeValidator = await getMintExchangeValidator(lucid);

    const authAssetName = `${mintAuthTokenValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;

    const tx = await lucid
        .newTx()
        .pay.ToContract(
            mintExchangeValidator.lockAddress,
            {kind: 'inline', value: Data.to(new Constr(0, [BigInt(0)]))},
            {
                [authAssetName]: BigInt(1),
                "lovelace": BigInt(0)
            }
        )
        .complete();

    await submitTx(tx, lucid);
}

export async function getLiquidityPoolUTxO(lucid: LucidEvolution) {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)
    const mintAuthValidators = await getMintAuthValidator(lucid);
    const mintExchangeValidator = await getMintExchangeValidator(lucid);

    const authAssetName = `${mintAuthValidators.policyId}${fromText(AUTH_TOKEN_NAME)}`;

    const utxos = await lucid.utxosAt(mintExchangeValidator.lockAddress);
    for (const utxo of utxos) {
        if (utxo.datum && utxo.assets[authAssetName] === BigInt(1)) {
            console.log("Liquidity pool ITxO:", utxo);
            const lpInfo = toObject(utxo.datum, LiquidityPoolInfoScheme);
            console.log("Liquidity pool info:", lpInfo);
            return utxo;
        }
    }

    throw new Error("Liquidity pool UTxO not found");
}

// mintAuthToken().then(() => console.log("Auth token minted successfully"));
// createLiquidityPoolUTxO().then(() => console.log("Liquidity pool UTxO created successfully"));
// getLiquidityPoolUTxO().then(() => console.log("Liquidity pool UTxO retrieved successfully"));