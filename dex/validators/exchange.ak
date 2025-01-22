use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction, Input,OutputReference}
use simpledex/types.{Asset, LiquidityAction, Add, Remove, SwapToAda, SwapToToken}
use simpledex/utils

validator exchange(trade_token: Asset, auth_token: Asset) {
    spend(_d, redeemer: LiquidityAction, contract_ref: OutputReference, self: Transaction) {
        expect Some(lp_input) =
            list.find(self.inputs, fn(input) { input.output_reference == contract_ref })
        
        expect Script(policy_id) = lp_input.output.address.payment_credential

        when redeemer is {
            Add -> add_liquidity(trade_token, policy_id, self, auth_token)
            Remove -> remove_liquidity(trade_token, policy_id, self, auth_token)
            SwapToAda -> swap_to_ada(trade_token, policy_id, self, auth_token)
            SwapToToken -> swap_to_token(trade_token, policy_id, self, auth_token)
        }
    }

    mint(redeemer: LiquidityAction, policy_id: PolicyId, self: Transaction) {
        when redeemer is {
            Add -> add_liquidity(trade_token, policy_id, self, auth_token)
            Remove -> remove_liquidity(trade_token, policy_id, self, auth_token)
            _ -> False
        }
    }
}

pub fn add_liquidity(trade_token: Asset, policy_id: PolicyId, self: Transaction, auth_token: Asset) -> Bool {
    let lp_input = utils.find_liquidity_pool_input(self.inputs, auth_token, policy_id)
    let lp_output = utils.find_liquidity_pool_output(self.outputs, auth_token, policy_id)
    utils.validate_minted_token(lp_input, lp_output, trade_token, self.mint, policy_id)
}

pub fn remove_liquidity(trade_token: Asset, policy_id: PolicyId, self: Transaction, auth_token: Asset) -> Bool {
    let lp_input = utils.find_liquidity_pool_input(self.inputs, auth_token, policy_id)
    let lp_output = utils.find_liquidity_pool_output(self.outputs, auth_token, policy_id)
    utils.validate_burned_token(lp_input, lp_output, trade_token, self.mint, policy_id)
}

pub fn swap_to_ada(trade_token: Asset, policy_id: PolicyId, self: Transaction, auth_token: Asset) -> Bool {
    let lp_input = utils.find_liquidity_pool_input(self.inputs, auth_token, policy_id)
    let lp_output = utils.find_liquidity_pool_output(self.outputs, auth_token, policy_id)
    utils.validate_swap_to_ada(lp_input, lp_output, trade_token)
}

pub fn swap_to_token(trade_token: Asset, policy_id: PolicyId, self: Transaction, auth_token: Asset) -> Bool {
    let lp_input = utils.find_liquidity_pool_input(self.inputs, auth_token, policy_id)
    let lp_output = utils.find_liquidity_pool_output(self.outputs, auth_token, policy_id)
    utils.validate_swap_to_token(lp_input, lp_output, trade_token)
}
