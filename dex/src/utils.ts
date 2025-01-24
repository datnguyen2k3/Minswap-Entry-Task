import {getValidator, getValidatorFrom, toObject} from "../../hello-world/common";
import {
    applyDoubleCborEncoding,
    applyParamsToScript, CML,
    Constr, Data,
    fromText, LucidEvolution, validatorToAddress,
    validatorToScriptHash
} from "@lucid-evolution/lucid";
import {
    Asset,
    AUTH_TOKEN_NAME,
    LIQUIDITY_POOL_INFO_SCHEME, MIN_TOKEN_NAME, MIN_TOKEN_POLICY_ID,
    MINT_AUTH_TOKEN_TITLE,
    MINT_EXCHANGE_TITLE,
    Validators,
    PLUTUS_PATH
} from "./types";

export function readValidators(validator_title: string, plutusPath: string, params: Data[]): Validators {
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

export function getAuthValidator(adminPublicKeyHash: string) : Validators{
    return readValidators(
        MINT_AUTH_TOKEN_TITLE,
        PLUTUS_PATH,
        [adminPublicKeyHash]
    );
}

export function getExchangeValidator(adminPublicKeyHash: string, tradeAsset?: Asset) : Validators{
    const mintAuthValidators = getAuthValidator(adminPublicKeyHash);

    let tradeTokenAsset = new Constr(0, [
        MIN_TOKEN_POLICY_ID,
        fromText(MIN_TOKEN_NAME)
    ]);

    if (tradeAsset) {
        tradeTokenAsset = new Constr(0, [
            tradeAsset.policyId,
            fromText(tradeAsset.tokenName)
        ]);
    }

    const authTokenAsset = new Constr(0, [
        mintAuthValidators.policyId,
        fromText(AUTH_TOKEN_NAME)
    ]);

    return readValidators(
        MINT_EXCHANGE_TITLE,
        PLUTUS_PATH,
        [tradeTokenAsset, authTokenAsset]
    );
}
