use aiken/collection/list
use aiken/collection/dict
use aiken/crypto.{ScriptHash, VerificationKeyHash}
use cardano/address.{Address, VerificationKey}
use cardano/assets.{PolicyId}
use cardano/transaction.{Input, Output, Transaction}

pub type LiquidityPool {
    token_amount: Int,
    ada_amount: Int,
}

pub type LiquidityAction {
    Create
    Add
    Remove
}

pub type Asset {
    policy_id: PolicyId,
    token_name: ByteArray,
}
