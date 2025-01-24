import {getAuthValidator, getExchangeValidator} from "../utils";
import {Asset, AUTH_TOKEN_NAME} from "../types";
import {Constr, Data, fromText, LucidEvolution} from "@lucid-evolution/lucid";
import {getLucidOgmiosInstance} from "../../../src/providers/lucid-instance";
import {getPublicKeyHash, submitTx} from "../../../hello-world/common";

export class AuthenMintingPolicy {
    private readonly adminPrivateKey: string;
    private lucid: LucidEvolution | undefined;

    constructor(adminPrivateKey: string) {
        this.adminPrivateKey = adminPrivateKey;
    }

    private async getLucid() {
        if (this.lucid) {
            return this.lucid;
        }

        const lucid = await getLucidOgmiosInstance();
        lucid.selectWallet.fromPrivateKey(this.adminPrivateKey);
        return lucid;
    }


    private async mintAuthToken() {
        const lucid = await this.getLucid();

        const publicKeyHash = getPublicKeyHash(this.adminPrivateKey);

        const mintAuthValidator = getAuthValidator(publicKeyHash);
        const authAssetName = `${mintAuthValidator.policyId}${fromText(AUTH_TOKEN_NAME)}`;
        const mintRedeemer = Data.to(new Constr(0, []));

        const tx = await lucid
            .newTx()
            .attach.MintingPolicy(mintAuthValidator.policyScripts)
            .mintAssets({[authAssetName]: BigInt(1)}, mintRedeemer)
            .complete();

        await submitTx(tx, lucid);
    }

    public async createLiquidityPoolUTxO(tradeAsset: Asset) {
        await this.mintAuthToken();
        const lucid = await this.getLucid();
        const publicKeyHash = getPublicKeyHash(this.adminPrivateKey);

        const mintAuthTokenValidator = getAuthValidator(publicKeyHash)
        const mintExchangeValidator = getExchangeValidator(publicKeyHash, tradeAsset);

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
}
