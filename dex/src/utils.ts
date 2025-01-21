import {getValidator, getValidatorFrom} from "../../hello-world/common";
import {
    applyDoubleCborEncoding,
    applyParamsToScript,
    Constr, Data,
    fromText, validatorToAddress,
    validatorToScriptHash
} from "@lucid-evolution/lucid";
import {MintValidators} from "./types";

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

export function  validateAddedLiquidity(addedLovelace: bigint, addedTradeToken: bigint, reservedLovelace: bigint, reservedTradeToken: bigint): boolean {
    const x1 = Number(addedLovelace)
    const y1 = Number(addedTradeToken)
    const x2 = Number(reservedLovelace)
    const y2 = Number(reservedTradeToken)

    console.log("x1/y1:", x1 / y1)
    console.log("x2/y2:", x2 / y2)


    return 100 * Math.abs(x1 * y2 - y1 * x2) <= y1 * y2
}