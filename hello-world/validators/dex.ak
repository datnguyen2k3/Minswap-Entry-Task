use aiken/collection/dict
use aiken/crypto
use cardano/address
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction, Input}
use simpledex/types.{Asset, LiquidityAction, Create, Add, Remove}
use simpledex/utils
use env

validator simple_dex(token: Asset) {
    mint(redeemer: LiquidityAction, policy_id: PolicyId, self: Transaction) {
        let Transaction { mint, inputs, outputs, .. } = self

        expect token.policy_id == #"e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72"
        expect token.token_name == "MIN"

        when redeemer is {
            Create -> createLiquidity(policy_id, self)
            Add -> addLiquidity(token, policy_id, self)
            Remove -> False // removeLiquidity()
        }
    }
}

pub fn createLiquidity(policy_id: PolicyId, self: Transaction) {
    expect [Pair(mint_asset_name, amount)] =
        self.mint
            |> assets.tokens(policy_id)
            |> dict.to_pairs()

    expect mint_asset_name == env.auth_token_name
    expect amount == 1
    utils.isHasAuthInput(self.inputs) == True
}

pub fn addLiquidity(token: Asset, policy_id: PolicyId, self: Transaction) -> Bool {
    let authInput = utils.findLiquidityPoolInput(self.inputs, policy_id)
    let Input { output: authInputOutput, .. } = authInput
    let authOutput = utils.findLiquidityPoolOutput(self.outputs, policy_id)
    expect authOutput.address == authInputOutput.address

    let sumLovelaceInput = utils.getSumLovelace(self.inputs)
    sumLovelaceInput == utils.lovelace_from_output(authOutput)
}
