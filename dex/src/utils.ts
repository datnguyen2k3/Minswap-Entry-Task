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