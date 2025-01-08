import { Lucid, Blockfrost, generateSeedPhrase } from "@lucid-evolution/lucid";
import * as Ogmios from "@cardano-ogmios/client";
import { OgmiosProvider } from "./ogmios-provider";

const main = async () => {
  const context = await Ogmios.createInteractionContext(
    (err) => { console.error("ogmios error", err)},
    (code, reason) => { console.error("ogmios close", {code, reason })},
    {
      connection: {
        address: {
          http: "https://ogmios1qx87def2yqulc2gpet5.preprod-v6.ogmios-m1.demeter.run",
          webSocket: "wss://ogmios1qx87def2yqulc2gpet5.preprod-v6.ogmios-m1.demeter.run",
        }
      }
    }
  );
  // const ledgerStateClient = await Ogmios.createLedgerStateQueryClient(context);
  // const a = await ledgerStateClient.networkTip()
  // console.log(a);

  const provider = new OgmiosProvider(context);
  const lucid = await Lucid(provider, "Preprod");
  const seedPhrase = "urge chuckle print picture behind hat client ask sword payment uncover equip alert rely remove crash letter grunt edit twenty test ecology museum dry";
  lucid.selectWallet.fromSeed(seedPhrase);
  const address = await lucid.wallet().address(); // Bech32 encodedaddress

  // wallet balance
  console.log(address);
  const utxos = await lucid.wallet().getUtxos();
  console.log(utxos);
}

main();
