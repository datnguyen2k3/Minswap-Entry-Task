import {Data, Script} from "@lucid-evolution/lucid";

export const AUTH_TOKEN_NAME = "AUTH_TOKEN"
export const LP_TOKEN_NAME = "LP_TOKEN";

export const MINT_AUTH_TOKEN_TITLE = "authen_minting_policy.authen_minting_policy.mint";
export const MINT_EXCHANGE_TITLE = "exchange.exchange.mint";

export const MIN_TOKEN_POLICY_ID = "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72";
export const MIN_TOKEN_NAME = "MIN";

export const PRIVATE_KEY_PATH = "/home/dat/Desktop/Minswap-Entry-Task/hello-world/me.sk"
export const PLUTUS_PATH = "/home/dat/Desktop/Minswap-Entry-Task/dex/plutus.json"
export const INIT_LP_TOKEN_AMOUNT = 1000000

export type MintValidators = {
    policyScripts: Script;
    policyId: string;
    lockAddress: string;
}

export const LIQUIDITY_POOL_INFO_SCHEME =  Data.Object({
    total_supply: Data.Integer()
})
