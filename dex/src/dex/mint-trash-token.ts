import {getLucidOgmiosInstance} from "../../../src/lucid-instance";
import {readValidators} from "../utils";
import {PLUTUS_PATH, PRIVATE_KEY_PATH_TEST} from "../types";
import {Constr, Data, fromText} from "@lucid-evolution/lucid";
import {getPrivateKeyFrom, submitTx} from "../../../hello-world/common";

export async function mintTrashToken(privateKey: string) {
    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(privateKey);

    const mintTrashValidator = readValidators(
        "mint_trash_token.mint_trash_token.mint",
        PLUTUS_PATH,
        []
    )
    const trashAssetName = `${mintTrashValidator.policyId}${fromText("TRASH_TOKEN")}`;
    const mintRedeemer = Data.to(new Constr(0, []));

    const tx = await lucid
        .newTx()
        .mintAssets({[trashAssetName]: BigInt(1000000000)}, mintRedeemer)
        .attach.MintingPolicy(mintTrashValidator.policyScripts)
        .complete();

    await submitTx(tx, lucid);
}
