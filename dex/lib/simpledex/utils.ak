use aiken/collection/dict
use aiken/collection/list
use aiken/math
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId, Value}
use cardano/transaction.{Input, Output, Datum, NoDatum, DatumHash, InlineDatum}
use env
use simpledex/types.{Asset, LiquidityPoolInfo}

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

pub fn validate_burned_token(lp_input: Input, lp_output: Output, trade_token: Asset, mint: Value, policy_id: PolicyId) -> Bool {
    expect [Pair(lp_asset_name, lp_asset_amount)] =
        mint
            |> assets.tokens(policy_id)
            |> dict.to_pairs()

    expect lp_asset_name == env.lp_token_name
    expect lp_asset_amount < 0
    let burned_lp_token = math.abs(lp_asset_amount)

    let input_supply = get_total_supply(lp_input.output.datum)
    expect input_supply > 0

    let output_supply = get_total_supply(lp_output.datum)
    expect output_supply >= 0

    let added_lovelace = get_added_lovelace(lp_input, lp_output)
    expect added_lovelace < 0

    let added_trade_token = get_added_trade_token(lp_input, lp_output, trade_token)
    expect added_trade_token < 0

    let reserved_lovelace = lovelace_from_input(lp_input)
    let reserved_trade_token = trade_token_from_input(lp_input, trade_token)
    let removed_lovelace = math.abs(added_lovelace)
    let removed_trade_token = math.abs(added_trade_token)

    expect True == validate_rational(
        removed_lovelace, reserved_lovelace, 
        burned_lp_token, input_supply
    )

    expect True == validate_rational(
        removed_trade_token, reserved_trade_token, 
        burned_lp_token, input_supply
    )

    output_supply == input_supply - burned_lp_token
}

pub fn validate_minted_token(lp_input: Input, lp_output: Output, trade_token: Asset, mint: Value, policy_id: PolicyId) -> Bool {
    expect [Pair(lp_asset_name, lp_asset_amount)] =
        mint
            |> assets.tokens(policy_id)
            |> dict.to_pairs()

    expect lp_asset_name == env.lp_token_name

    let input_supply = get_total_supply(lp_input.output.datum)
    expect input_supply >= 0

    let output_supply = get_total_supply(lp_output.datum)
    expect output_supply >= 0
    
    let added_lovelace = get_added_lovelace(lp_input, lp_output)
    let added_trade_token = get_added_trade_token(lp_input, lp_output, trade_token)
    let reserved_lovelace = lovelace_from_input(lp_input)
    let reserved_trade_token = trade_token_from_input(lp_input, trade_token)
    
    if input_supply == 0 {
        expect lp_asset_amount == 1000000
        output_supply == lp_asset_amount
    } else {
        expect True == validate_rational(
            added_lovelace, added_trade_token, 
            reserved_lovelace, reserved_trade_token
        )

        expect lp_asset_amount == math.min(
            input_supply * added_lovelace / reserved_lovelace,
            input_supply * added_trade_token / reserved_trade_token
        )
        output_supply == lp_asset_amount + input_supply
    }
}

pub fn validate_swap_to_ada(lp_input: Input, lp_output: Output, trade_token: Asset) -> Bool {
    let input_supply = get_total_supply(lp_input.output.datum)
    let output_supply = get_total_supply(lp_output.datum)
    expect input_supply == output_supply

    let added_lovelace = get_added_lovelace(lp_input, lp_output)
    expect added_lovelace < 0

    let added_trade_token = get_added_trade_token(lp_input, lp_output, trade_token)
    expect added_trade_token > 0

    let removed_lovelace = math.abs(added_lovelace)
    let reserved_lovelace = lovelace_from_input(lp_input)
    let reserved_trade_token = trade_token_from_input(lp_input, trade_token)

    removed_lovelace == added_trade_token * reserved_lovelace * 1000 / ((reserved_trade_token + added_trade_token) * 997)
}

pub fn validate_swap_to_token(lp_input: Input, lp_output: Output, trade_token: Asset) -> Bool {
    let input_supply = get_total_supply(lp_input.output.datum)
    let output_supply = get_total_supply(lp_output.datum)
    expect input_supply == output_supply

    let added_lovelace = get_added_lovelace(lp_input, lp_output)
    expect added_lovelace > 0

    let added_trade_token = get_added_trade_token(lp_input, lp_output, trade_token)
    expect added_trade_token < 0

    let removed_trade_token = math.abs(added_trade_token)
    let reserved_lovelace = lovelace_from_input(lp_input)
    let reserved_trade_token = trade_token_from_input(lp_input, trade_token)

    removed_trade_token == added_lovelace * reserved_trade_token * 1000 / ((reserved_lovelace + added_lovelace) * 997)
}

pub fn validate_rational(x1: Int, y1: Int, x2: Int, y2: Int) -> Bool {
    100 * math.abs(x1 * y2 - x2 * y1) <= y1 * y2
}

pub fn find_liquidity_pool_input(inputs: List<Input>, auth_asset: Asset, policy_id: PolicyId) -> Input {
    let authInputs = list.filter(
        inputs,
        fn(input) {
            let credential = input.output.address.payment_credential
            when credential is {
                Script(output_policy_id) -> {
                    is_input_has_auth_asset(input, auth_asset) && output_policy_id == policy_id
                }
                _ -> False
            }
        }
    )

    expect list.length(authInputs) == 1
    expect Some(authInput) = list.head(authInputs)
    authInput
}

pub fn find_liquidity_pool_output(outputs: List<Output>, auth_asset: Asset, policy_id: PolicyId) -> Output {
    let authOutputs = list.filter(
        outputs,
        fn(output) {
            let credential = output.address.payment_credential
            when credential is {
                Script(output_policy_id) -> {
                    is_output_has_auth_asset(output, auth_asset) && output_policy_id == policy_id
                }
                _ -> False
            }
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

pub fn get_total_supply(datum: Datum) -> Int {
    when datum is {
        NoDatum -> -1
        DatumHash(_) -> -1
        InlineDatum(data) -> {
            if data is LiquidityPoolInfo {
                data.total_supply
            } else {
                -1
            }
        }
    }
}
