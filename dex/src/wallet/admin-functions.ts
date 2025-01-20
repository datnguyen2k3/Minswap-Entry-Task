import {readMintValidators} from "../utils";
import {AUTH_TOKEN_NAME, LiquidityPoolInfoScheme, MintValidators, PLUTUS_PATH, PRIVATE_KEY_PATH} from "../types";
import {Constr, Data, fromText} from "@lucid-evolution/lucid";
import {getLucidOgmiosInstance} from "../../../src/lucid-instance";
import {getPrivateKeyFrom, getPublicKeyHash, submitTx, toObject} from "../../../hello-world/common";

const MINT_AUTH_TOKEN_TITLE = "authen_minting_policy.authen_minting_policy.mint";
const MINT_EXCHANGE_TITLE = "exchange.exchange.mint";

async function getMintAuthValidator() {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)
    const publicKeyHash = await getPublicKeyHash(privateKey);
    return readMintValidators(
        MINT_AUTH_TOKEN_TITLE,
        PLUTUS_PATH,
        [publicKeyHash]
    );
}

async function getMintExchangeValidator() : Promise<MintValidators>{
    const tradeTokenAsset = new Constr(0, [
        "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72",
        fromText("MIN")
    ]);

    const authTokenAsset = new Constr(0, [
        (await getMintAuthValidator()).policyId,
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
    const mintAuthValidator = await getMintAuthValidator()
    const authAssetName = `${mintAuthValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;
    const mintRedeemer = Data.to(new Constr(0, []));

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const tx = await lucid
        .newTx()
        .attach.MintingPolicy(mintAuthValidator.policyScripts)
        .mintAssets({[authAssetName]: BigInt(1)}, mintRedeemer)
        .complete();

    await submitTx(tx, lucid);
}

export async function createLiquidityPoolUTxO() {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)
    const mintAuthTokenValidator = await getMintAuthValidator()
    const mintExchangeValidator = await getMintExchangeValidator();

    const authAssetName = `${mintAuthTokenValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const tx = await lucid
        .newTx()
        .pay.ToContract(
            mintExchangeValidator.lockAddress,
            {kind: 'inline', value: Data.to(new Constr(0, [BigInt(0)]))},
            {[authAssetName]: BigInt(1)}
        )
        .complete();

    await submitTx(tx, lucid);
}

export async function getLiquidityPoolUTxO() {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)
    const mintAuthValidators = await getMintAuthValidator();
    const mintExchangeValidator = await getMintExchangeValidator();

    const authAssetName = `${mintAuthValidators.policyId}${fromText(AUTH_TOKEN_NAME)}`;

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const utxos = await lucid.utxosAt(mintExchangeValidator.lockAddress);
    for (const utxo of utxos) {
        if (utxo.datum && utxo.assets[authAssetName] === BigInt(1)) {
            console.log(utxo);
            const lpInfo = toObject(utxo.datum, LiquidityPoolInfoScheme);
            console.log("Liquidity pool info:", lpInfo);
            return utxo;
        }
    }
}

// mintAuthToken().then(() => console.log("Auth token minted successfully"));
// createLiquidityPoolUTxO().then(() => console.log("Liquidity pool UTxO created successfully"));
// getLiquidityPoolUTxO().then(() => console.log("Liquidity pool UTxO retrieved successfully"));