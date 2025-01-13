use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction, ValidityRange}
use aiken/collection/list
use aiken/interval.{Finite, PositiveInfinity, IntervalBound, Interval}

pub type DatumVesting {
    lock_until: POSIXTime, 
    beneficiary: VerificationKeyHash
}

pub type POSIXTime = Int

validator vesting {
    spend(
        datum: Option<DatumVesting>,
        _redeemer: Data,
        _own_ref: OutputReference,
        self: Transaction,
    ) {
        expect Some(DatumVesting { lock_until, beneficiary }) = datum
        must_be_signed_by(self, beneficiary)? && must_start_after(self.validity_range, lock_until)?
    }
}

fn must_be_signed_by(transaction: Transaction, vk: VerificationKeyHash) {
    list.has(transaction.extra_signatories, vk)
}

fn must_start_after(range: ValidityRange, lock_expiration_time: POSIXTime) {
    when range.lower_bound.bound_type is {
        Finite(tx_earliest_time) -> lock_expiration_time <= tx_earliest_time
        _ -> False
    }
}

test must_be_signed_by_example() {
    let vk = #"00000000000000000000000000000000000000000000000000000000"
    let tx = Transaction { ..transaction.placeholder, extra_signatories: [vk] }

    must_be_signed_by(tx, vk)
}

test must_start_after_example() {
    let lock_expiration_time = 50
    let tx_earliest_time = 100
    let range: ValidityRange = Interval {
        lower_bound: IntervalBound { bound_type: Finite(tx_earliest_time), is_inclusive: True },
        upper_bound: IntervalBound { bound_type: PositiveInfinity, is_inclusive: True }
    }

    must_start_after(range, lock_expiration_time)
}
