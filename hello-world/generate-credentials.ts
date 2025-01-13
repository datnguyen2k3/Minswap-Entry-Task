import * as Ogmios from "@cardano-ogmios/client";
import {OgmiosProvider} from "../src/providers/ogmios-provider";
import {generatePrivateKey, Lucid} from "@lucid-evolution/lucid";
import fs from 'node:fs';

async function main(): Promise<void> {
    const context = await Ogmios.createInteractionContext(
        (err) => {
            console.error("ogmios error", err)
        },
        (code, reason) => {
            console.error("ogmios close", {code, reason})
        },
        {
            connection: {
                address: {
                    http: "https://ogmios1qx87def2yqulc2gpet5.preprod-v6.ogmios-m1.demeter.run",
                    webSocket: "wss://ogmios1qx87def2yqulc2gpet5.preprod-v6.ogmios-m1.demeter.run",
                }
            }
        }
    );

    const provider = new OgmiosProvider(context);
    const lucid = await Lucid(provider, "Preprod");

    const privateKey = generatePrivateKey();
    fs.writeFileSync('me.sk', privateKey);

    lucid.selectWallet.fromPrivateKey(privateKey);
    const address = await lucid.wallet().address();
    fs.writeFileSync('me.addr', address);

    return;
}

main();
