use cardano/assets.{PolicyId}

pub type LiquidityPool {
    token_amount: Int,
    ada_amount: Int,
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
