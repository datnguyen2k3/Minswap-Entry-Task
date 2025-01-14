use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/address.{Script}
use cardano/transaction.{OutputReference, Transaction} as tx

pub type Action {
  CheckMint
  CheckBurn
}

validator gift_card(token_name: ByteArray, utxo_ref: OutputReference) {
    spend(_d, _r, own_ref: OutputReference, transaction: Transaction) -> Bool {
        let Transaction { mint, inputs, .. } = transaction
        expect Some(own_input) = list.find(
            inputs, 
            fn(input) { input.output_reference == own_ref }
        )
 
        expect Script(policy_id) = own_input.output.address.payment_credential
    
        expect [Pair(asset_name, amount)] =
            mint
                |> assets.tokens(policy_id)
                |> dict.to_pairs()

        amount == -1 && asset_name == token_name
    }
 
    mint(redeemer: Action, policy_id: PolicyId, transaction: Transaction) -> Bool {
        let Transaction { inputs, mint, .. } = transaction

        expect [Pair(asset_name, amount)] = 
            mint
                |> assets.tokens(policy_id)
                |> dict.to_pairs()


        when redeemer is {
            CheckMint -> {
                expect True = list.any(inputs, fn(input) { input.output_reference == utxo_ref })
                amount == 1 && asset_name == token_name
            }
            CheckBurn -> {
                amount == -1 && asset_name == token_name
            }
        }
    }
}
