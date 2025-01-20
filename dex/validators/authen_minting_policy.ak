use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/address.{Address, VerificationKey}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction, Input, Output}
use env

validator authen_minting_policy(address_hash: VerificationKeyHash) {
    mint(_r, policy_id: PolicyId, self: Transaction) {
        let Transaction { mint, inputs, .. } = self

        expect [Pair(mint_asset_name, amount)] =
            mint
                |> assets.tokens(policy_id)
                |> dict.to_pairs()

        expect mint_asset_name == env.auth_token_name
        expect amount == 1

        list.any(
            inputs,
            fn(input) {
                let Input { output, .. } = input
                let Output { address, .. } = output
                let Address { payment_credential, ..} = address
                expect VerificationKey(hash) = payment_credential
                hash == address_hash
            }
        )
    }
}
