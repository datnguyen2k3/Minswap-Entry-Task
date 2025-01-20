use cardano/assets.{PolicyId}

pub type LiquidityPoolInfo {
    total_supply: Int,
}

pub type LiquidityAction {
    Add
    Remove
    SwapToAda
    SwapToToken
}

pub type Asset {
    policy_id: PolicyId,
    token_name: ByteArray,
}
