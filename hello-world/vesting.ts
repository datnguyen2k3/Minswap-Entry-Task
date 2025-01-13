import {Data} from "@lucid-evolution/lucid";
import {lock_assets} from "./lock";
import {getPublicKeyHash, getScriptsAddress, toCBOR} from "./common";

const DatumVestingScheme = Data.Object({
    lock_until: Data.Integer(),
    beneficiary: Data.Bytes(),
});

const VestingValidatorIndex = 2;

export async function lockAssetsToVestingScriptsAddress(amount: bigint): Promise<void> {
    const vestingScriptAddress = getScriptsAddress(VestingValidatorIndex);
    lock_assets(
        vestingScriptAddress,
        amount,
        toCBOR(
            {
                lock_until: BigInt(50),
                beneficiary: await getPublicKeyHash(),
            },
            DatumVestingScheme
        )
    );
}

export async function unlockAssetsToVestingScriptsAddress(receiveAddress: string): Promise<void> {

}

async function main(): Promise<void> {
    await lockAssetsToVestingScriptsAddress(BigInt(1000000));
}
