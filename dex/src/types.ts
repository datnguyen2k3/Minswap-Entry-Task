import {Data, Script} from "@lucid-evolution/lucid";

export const AUTH_TOKEN_NAME = "AUTH_TOKEN"
export const LP_TOKEN_NAME = "LP_TOKEN";

export const PRIVATE_KEY_PATH = "/home/dat/Desktop/Minswap-Entry-Task/hello-world/me.sk"
export const PLUTUS_PATH = "/home/dat/Desktop/Minswap-Entry-Task/dex/plutus.json"
export const INIT_LP_TOKEN_AMOUNT = 1000000

export type MintValidators = {
    policyScripts: Script;
    policyId: string;
    lockAddress: string;
}

export const LiquidityPoolInfoScheme =  Data.Object({
    total_supply: Data.Integer()
})
