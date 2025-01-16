use aiken/collection/list
use cardano/assets
use cardano/transaction.{Input, Output}
use simpledex/types.{Asset}
use cardano/assets.{PolicyId}
use cardano/address.{Address, VerificationKey}
use env

pub fn getSumLovelace(inputs: List<Input>) -> Int {
    let sumLovelace = list.foldl(
        inputs,
        0,
        fn(input, total) { 
            let Input { output, .. } = input
            let Output { value, .. } = output
            total + assets.lovelace_of(value)
        }
    )
    sumLovelace
}

pub fn findLiquidityPoolInput(inputs: List<Input>, policy_id: PolicyId) -> Input {
    expect Some(pool_input) = list.find(
        inputs,
        fn(input) {
            let Input { output, .. } = input
            let Output { value, .. } = output
            assets.quantity_of(
                value,
                policy_id,
                env.auth_token_name,
            ) == 1
        }
    )

    pool_input
}


pub fn isHasAuthInput(inputs: List<Input>) -> Bool {
    list.any(
        inputs,
        fn(input) {
            let Input { output, .. } = input
            let Output { address, .. } = output
            let Address { payment_credential, ..} = address
            expect VerificationKey(hash) = payment_credential
            hash == env.auth_address_hash
        }
    )
}

pub fn findLiquidityPoolOutput(outputs: List<Output>, policy_id: PolicyId) -> Output {
    expect Some(pool_output) = list.find(
        outputs,
        fn(output) {
            let Output { value, .. } = output
            assets.quantity_of(
                value,
                policy_id,
                env.auth_token_name,
            ) == 1
        }
    )

    pool_output
}

pub fn lovelace_from_output(output: Output) -> Int {
    let Output { value, .. } = output
    assets.lovelace_of(value)
}

pub fn lovelace_from_input(input: Input) -> Int {
    let Input { output, .. } = input
    let Output { value, .. } = output
    assets.lovelace_of(value)
}