import {readMintValidators} from "../utils";
import {AUTH_TOKEN_NAME, PLUTUS_PATH, PRIVATE_KEY_PATH} from "../types";
import {Constr, Data, fromText} from "@lucid-evolution/lucid";
import {getLucidOgmiosInstance} from "../../../src/lucid-instance";
import {getPrivateKeyFrom, getPublicKeyHash, submitTx} from "../../../hello-world/common";

const MINT_AUTH_TOKEN_TITLE = "authen_minting_policy.authen_minting_policy.mint";

export async function mintAuthToken() {
    const privateKey = getPrivateKeyFrom(PRIVATE_KEY_PATH)
    const publicKeyHash = await getPublicKeyHash(privateKey);
    const mintValidator = readMintValidators(MINT_AUTH_TOKEN_TITLE, PLUTUS_PATH, [publicKeyHash]);
    const assetName = `${mintValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;
    const mintRedeemer = Data.to(new Constr(0, []));

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const tx = await lucid
        .newTx()
        .attach.MintingPolicy(mintValidator.policyScripts)
        .mintAssets({[assetName]: BigInt(1)}, mintRedeemer)
        .complete();

    await submitTx(tx, lucid);
}
