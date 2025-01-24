import {Constr, Data, UTxO} from "@lucid-evolution/lucid";
import {lock_assets} from "./lock";
import {
    getPrivateKey,
    getPublicKeyHash,
    getScriptsAddress,
    getValidator,
    isCantCastCborToObject, submitTx,
    toCBOR,
    toObject
} from "./common";
import {getLucidOgmiosInstance} from "../src/providers/lucid-instance";
import {utf8ToHex} from "../src/common/ultis";

const DatumVestingScheme = Data.Object({
    lock_until: Data.Integer(),
    beneficiary: Data.Bytes(),
});

const vestingTitle = "vesting.vesting.spend";

export async function lockAssetsToVestingScriptsAddress(amount: bigint): Promise<void> {
    const vestingScriptAddress = getScriptsAddress(vestingTitle);
    await lock_assets(
        vestingScriptAddress,
        amount,
        toCBOR(
            {
                lock_until: BigInt(50),
                beneficiary: getPublicKeyHash(getPrivateKey()),
            },
            DatumVestingScheme
        )
    );
}

export async function isValidVestingScriptAddressUTxO(utxo: UTxO, publicKeysHash: string): Promise<boolean> {
    if (!utxo.datum) {
        return false;
    }
    const datum = toObject(utxo.datum, DatumVestingScheme);
    return datum.lock_until < BigInt(Date.now()) && datum.beneficiary === publicKeysHash;
}

export async function getVestingScriptAddressUTxOs(): Promise<UTxO[]> {
    const scriptAddress = getScriptsAddress(vestingTitle);
    const lucid = await getLucidOgmiosInstance();
    const scriptsAddressUtxos = await lucid.utxosAt(scriptAddress);
    const publicKeyHash = getPublicKeyHash(getPrivateKey());
    const utxos: UTxO[] = [];

    for (const utxo of scriptsAddressUtxos) {
        try {
            if (await isValidVestingScriptAddressUTxO(utxo, publicKeyHash)) {
                utxos.push(utxo);
            }
        } catch (e) {
            if (isCantCastCborToObject(e)) {
                continue;
            }
            console.error("Error parsing datum:", e);
        }
    }

    console.log("Vesting script address UTxOs:", utxos);
    return utxos;
}

export async function unlockAssetsToVestingScriptsAddress(): Promise<void> {
    const utxos = await getVestingScriptAddressUTxOs();
    const receiveAddress = "addr_test1vpfsn7ncdptvzf3dp9dcnt0kfl522f266xg59jw9xu6eusgmessnp"
    const spendValidator = getValidator(vestingTitle);
    const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello, World!")]));
    const amount = BigInt(1000000);

    const lucid = await getLucidOgmiosInstance();
    lucid.selectWallet.fromPrivateKey(getPrivateKey());

    const tx = await lucid
        .newTx()
        .collectFrom(utxos, redeemer)
        .addSigner(await lucid.wallet().address())
        .validFrom(Date.now() - 100000000)
        .validTo(Date.now() + 100000000)
        .pay.ToAddress(
            receiveAddress,
            {lovelace: BigInt(amount)}
        )
        .attach.SpendingValidator(spendValidator)
        .complete();

    await submitTx(tx, lucid);
}

async function main(): Promise<void> {
    // await lockAssetsToVestingScriptsAddress(BigInt(1000000));
    // await unlockAssetsToVestingScriptsAddress();
}

main().then(r => console.log("Done!")).catch(e => console.error(e));
