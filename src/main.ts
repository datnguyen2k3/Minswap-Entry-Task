import {getLucidOgmiosInstance} from "./lucid-instance";
import {LucidEvolution} from "@lucid-evolution/lucid";

const main = async () => {
    const lucid = await getLucidOgmiosInstance();
    const seedPhrase = "urge chuckle print picture behind hat client ask sword payment uncover equip alert rely remove crash letter grunt edit twenty test ecology museum dry";
    lucid.selectWallet.fromSeed(seedPhrase);

}

const getAddresses = async (lucid: LucidEvolution) => {
    const addresses = await lucid.wallet().address();
    console.log("Addresses: ", addresses);
}

const getBalance = async (lucid: LucidEvolution) => {
    const utxos = await lucid.wallet().getUtxos();
    console.log("UTxOs: ", utxos);
}

const submitTx = async (lucid: LucidEvolution) => {
    const receive_address = 'addr_test1qqlr0955spgj8qx4dr4a3atsfgmg6957uyg33lfgfnvfyv4h3mgagzw5nzmlqw5mq386hvffyxrqhqve8pjn8ddnh55sy2kqx9'
    const amount = 1000000;
    const tx = await lucid
        .newTx()
        .pay.ToAddress(receive_address, {lovelace: BigInt(amount)})
        .complete();
    const signedTx = await tx.sign.withWallet().complete();
    const txHash = await signedTx.submit();
    console.log("TxHash: ", txHash);
}

main();
