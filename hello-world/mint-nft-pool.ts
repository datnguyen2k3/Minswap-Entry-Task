import {
    applyDoubleCborEncoding,
    applyParamsToScript,
    Constr, Data,
    fromText, Script,
    Validator, validatorToAddress,
    validatorToScriptHash
} from "@lucid-evolution/lucid";
import {getPrivateKey, getValidator, submitTx} from "./common";
import {getLucidOgmiosInstance} from "../src/lucid-instance";

const mintNftPoolTitle = "dex.simple_dex.mint"
const authLiquidityToken = "AuthLiquidityToken"

export type MintValidators = {
    policyScripts: Script;
    policyId: string;
    lockAddress: string;
}

export const LiquidityPoolScheme = Data.Object({
    token_amount: Data.Integer(),
    ada_amount: Data.Integer(),
});

export type LiquidityPool = {
    token_amount: bigint;
    ada_amount: bigint;
}

function readMintValidators(): MintValidators {
    const validator = getValidator(mintNftPoolTitle)
    const tradeTokenPolicyId = "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72"
    const tradeTokenName = "MIN"

    const param = new Constr(0, [tradeTokenPolicyId, fromText(tradeTokenName)])

    const paramScripts = applyParamsToScript(
        applyDoubleCborEncoding(validator.script),
        [param]
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

async function mintAuthToken() {
    const mintValidators = readMintValidators()

    const assetName = `${mintValidators.policyId}${fromText(
        authLiquidityToken
    )}`

    const lucid = await getLucidOgmiosInstance()
    lucid.selectWallet.fromPrivateKey(getPrivateKey())
    const createRedeemer = Data.to(new Constr(0, []))

    const tx = await lucid
        .newTx()
        .collectFrom(await lucid.wallet().getUtxos())
        .attach.MintingPolicy(mintValidators.policyScripts)
        .mintAssets({[assetName]: BigInt(1)}, createRedeemer)
        .complete();

    await submitTx(tx, lucid);
}

async function createLiquidityPoolUTxO() {
    const mintValidators = readMintValidators()
    const assetName = `${mintValidators.policyId}${fromText(
        authLiquidityToken
    )}`

    const lucid = await getLucidOgmiosInstance()
    lucid.selectWallet.fromPrivateKey(getPrivateKey())
    const datum = Data.to(new Constr(0, [BigInt(0), BigInt(0)]))

    const tx = await lucid
        .newTx()
        .collectFrom(await lucid.wallet().getUtxos())
        .pay.ToContract(
            mintValidators.lockAddress,
            {kind: 'inline', value: datum},
            {[assetName]: BigInt(1)}
        )
        .complete();

    await submitTx(tx, lucid);
}



// mintAuthToken().then(() => console.log("Minted Auth Token")).catch(console.error)
createLiquidityPoolUTxO().then(() => console.log("Created Liquidity Pool UTxO")).catch(console.error)