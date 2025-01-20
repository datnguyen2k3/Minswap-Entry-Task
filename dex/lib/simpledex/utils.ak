use aiken/collection/dict
use aiken/collection/list
use aiken/math/rational
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId, Value}
use cardano/transaction.{Input, Output}
use env
use simpledex/types.{Asset}

pub fn get_sum_lovelace_from_inputs(inputs: List<Input>) -> Int {
    let sum_lovelace = list.foldl(
        inputs,
        0,
        fn(input, total) { 
            lovelace_from_input(input) + total
        }
    )
    sum_lovelace
}

pub fn get_sum_trade_token_from_inputs(inputs: List<Input>, trade_token: Asset) -> Int {
    let sum_trade_token = list.foldl(
        inputs,
        0,
        fn(input, total) { 
            trade_token_from_input(input, trade_token) + total
        }
    )
    sum_trade_token
}

pub fn get_added_lovelace(lp_input: Input, lp_output: Output) {
    lovelace_from_output(lp_output) - lovelace_from_input(lp_input)
}

pub fn get_added_trade_token(lp_input: Input, lp_output: Output, trade_token: Asset) {
    trade_token_from_output(lp_output, trade_token) - trade_token_from_input(lp_input, trade_token)
}

pub fn validate_minted_token(lp_input: Input, lp_output: Output, trade_token: Asset, mint: Value, policy_id: PolicyId) -> Bool {
    let added_lovelace = get_added_lovelace(lp_input, lp_output)
    let added_trade_token = get_added_trade_token(lp_input, lp_output, trade_token)
    let reserved_lovelace = lovelace_from_input(lp_input)
    let reserved_trade_token = trade_token_from_input(lp_input, trade_token)
    
    expect Some(added_rational) = rational.new(added_lovelace, added_trade_token)
    expect Some(reserved_rational) = rational.new(reserved_lovelace, reserved_trade_token)
    expect rational.compare(added_rational, reserved_rational) == Equal

    expect [Pair(lp_asset_name, lp_asset_amount)] =
        mint
            |> assets.tokens(policy_id)
            |> dict.to_pairs()

    lp_asset_name == env.lp_token_name && lp_asset_amount == added_lovelace
}

pub fn validate_policy_lp(policy_id: PolicyId, lp_input: Input, lp_output: Output) -> Bool {
    expect Script(input_policy_id) = lp_input.output.address.payment_credential
    expect Script(output_policy_id) = lp_output.address.payment_credential
    input_policy_id == policy_id && output_policy_id == policy_id
}

pub fn find_liquidity_pool_input(inputs: List<Input>, auth_asset: Asset) -> Input {
    let authInputs = list.filter(
        inputs,
        fn(input) {
            is_input_has_auth_asset(input, auth_asset)
        }
    )

    expect list.length(authInputs) == 1
    expect Some(authInput) = list.head(authInputs)
    authInput
}

pub fn find_liquidity_pool_output(outputs: List<Output>, auth_asset: Asset) -> Output {
    let authOutputs = list.filter(
        outputs,
        fn(output) {
            is_output_has_auth_asset(output, auth_asset)
        }
    )

    expect list.length(authOutputs) == 1
    expect Some(authOutput) = list.head(authOutputs)
    authOutput
}

pub fn is_input_has_auth_asset(input: Input, auth_asset: Asset) -> Bool {
    let Input { output, .. } = input
    is_output_has_auth_asset(output, auth_asset)
}

pub fn is_output_has_auth_asset(output: Output, auth_asset: Asset) -> Bool {
    let Output { value, .. } = output
    assets.quantity_of(
        value,
        auth_asset.policy_id,
        auth_asset.token_name,
    ) == 1
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

pub fn trade_token_from_output(output: Output, trade_token: Asset) -> Int {
    let Output { value, .. } = output
    assets.quantity_of(
        value,
        trade_token.policy_id,
        trade_token.token_name,
    )
}

pub fn trade_token_from_input(input: Input, trade_token: Asset) -> Int {
    let Input { output, .. } = input
    trade_token_from_output(output, trade_token)
}
