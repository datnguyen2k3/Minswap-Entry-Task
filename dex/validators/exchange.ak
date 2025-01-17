use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction, Input,OutputReference}
use simpledex/types.{Asset, LiquidityAction, Add}
use simpledex/utils

validator exchange(trade_token: Asset, auth_token: Asset) {
    spend(_d, redeemer: LiquidityAction, contract_ref: OutputReference, self: Transaction) {
        expect Some(lp_input) =
            list.find(self.inputs, fn(input) { input.output_reference == contract_ref })
        
        expect Script(policy_id) = lp_input.output.address.payment_credential

        when redeemer is {
            Add -> add_liquidity(trade_token, policy_id, self, auth_token)
            _ -> False
        }
    }

    mint(redeemer: LiquidityAction, policy_id: PolicyId, self: Transaction) {
        // expect token.policy_id == #"e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72"
        // expect token.token_name == "MIN"

        when redeemer is {
            Add -> add_liquidity(trade_token, policy_id, self, auth_token)
            _ -> False
        }
    }
}

pub fn add_liquidity(trade_token: Asset, policy_id: PolicyId, self: Transaction, auth_token: Asset) -> Bool {
    let lp_input = utils.find_liquidity_pool_input(self.inputs, auth_token)
    let lp_output = utils.find_liquidity_pool_output(self.outputs, auth_token)

    expect True == utils.validate_policy_lp(policy_id, lp_input, lp_output)
    utils.validate_minted_token(lp_input, lp_output, trade_token, self.mint, policy_id)
}
