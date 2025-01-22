import {getMintAuthValidator, getMintExchangeValidator} from "../utils";
import {AUTH_TOKEN_NAME} from "../types";
import {Constr, Data, fromText} from "@lucid-evolution/lucid";
import {getLucidOgmiosInstance} from "../../../src/lucid-instance";
import {getPublicKeyHash, submitTx} from "../../../hello-world/common";

export async function mintAuthToken(privateKey: string) {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const publicKeyHash = getPublicKeyHash(privateKey);

    const mintAuthValidator = getMintAuthValidator(publicKeyHash);
    const authAssetName = `${mintAuthValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;
    const mintRedeemer = Data.to(new Constr(0, []));

    const tx = await lucid
        .newTx()
        .attach.MintingPolicy(mintAuthValidator.policyScripts)
        .mintAssets({[authAssetName]: BigInt(1)}, mintRedeemer)
        .complete();

    await submitTx(tx, lucid);
}

export async function createLiquidityPoolUTxO(privateKey: string) {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const publicKeyHash = getPublicKeyHash(privateKey);

    const mintAuthTokenValidator = getMintAuthValidator(publicKeyHash)
    const mintExchangeValidator = getMintExchangeValidator(publicKeyHash);

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
