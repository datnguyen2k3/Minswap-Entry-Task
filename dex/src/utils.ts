import {getValidator, getValidatorFrom, toObject} from "../../hello-world/common";
import {
    applyDoubleCborEncoding,
    applyParamsToScript,
    Constr, Data,
    fromText, LucidEvolution, validatorToAddress,
    validatorToScriptHash
} from "@lucid-evolution/lucid";
import {
    AUTH_TOKEN_NAME,
    LIQUIDITY_POOL_INFO_SCHEME, MIN_TOKEN_NAME, MIN_TOKEN_POLICY_ID,
    MINT_AUTH_TOKEN_TITLE,
    MINT_EXCHANGE_TITLE,
    MintValidators,
    PLUTUS_PATH
} from "./types";

export function readMintValidators(validator_title: string, plutusPath: string, params: Data[]): MintValidators {
    const validator = getValidatorFrom(validator_title, plutusPath)

    const paramScripts = applyParamsToScript(
        applyDoubleCborEncoding(validator.script),
        params
    )

    const policyId = validatorToScriptHash({
        type: "PlutusV3",
        script: paramScripts
    })

    const lockAddress = validatorToAddress("Preprod", {
        type: "PlutusV3",
        script: paramScripts
    })

    return {
        policyScripts: {
            type: "PlutusV3",
            script: applyDoubleCborEncoding(paramScripts)
        },
        policyId: policyId,
        lockAddress: lockAddress
    }
}

export function  isEqualRational(a1: bigint, b1: bigint, a2: bigint, b2: bigint): boolean {
    const x1 = Number(a1)
    const y1 = Number(b1)
    const x2 = Number(a2)
    const y2 = Number(b2)

    // console.log("x1/y1:", x1 / y1)
    // console.log("x2/y2:", x2 / y2)

    return 100 * Math.abs(x1 * y2 - y1 * x2) <= y1 * y2
}

export function getMintAuthValidator(adminPublicKeyHash: string) : MintValidators{
    return readMintValidators(
        MINT_AUTH_TOKEN_TITLE,
        PLUTUS_PATH,
        [adminPublicKeyHash]
    );
}

export function getMintExchangeValidator(adminPublicKeyHash: string, tradeTokenPolicyId?: string, tradeTokenName?: string) : MintValidators{
    const mintAuthValidators = getMintAuthValidator(adminPublicKeyHash);

    let tradeTokenAsset = new Constr(0, [
        MIN_TOKEN_POLICY_ID,
        fromText(MIN_TOKEN_NAME)
    ]);

    if (tradeTokenPolicyId && tradeTokenName) {
        tradeTokenAsset = new Constr(0, [
            tradeTokenPolicyId,
            fromText(tradeTokenName)
        ]);
    }

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

export async function getLiquidityPoolUTxO(lucid: LucidEvolution, adminPublicKeyHash: string) {
    const mintAuthValidators = getMintAuthValidator(adminPublicKeyHash);
    const mintExchangeValidator = getMintExchangeValidator(adminPublicKeyHash);

    const authAssetName = `${mintAuthValidators.policyId}${fromText(AUTH_TOKEN_NAME)}`;

    const utxos = await lucid.utxosAt(mintExchangeValidator.lockAddress);
    for (const utxo of utxos) {
        if (utxo.datum && utxo.assets[authAssetName] === BigInt(1)) {
            console.log("Liquidity pool UTxO:", utxo);
            const lpInfo = toObject(utxo.datum, LIQUIDITY_POOL_INFO_SCHEME);
            console.log("Liquidity pool info:", lpInfo);
            return utxo;
        }
    }

    throw new Error("Liquidity pool UTxO not found");
}
