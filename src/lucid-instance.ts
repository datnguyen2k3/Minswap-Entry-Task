import * as Ogmios from "@cardano-ogmios/client";
import {OgmiosProvider} from "./providers/ogmios-provider";
import {Blockfrost, Lucid} from "@lucid-evolution/lucid";

export async function getLucidOgmiosInstance() {
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
    return await Lucid(provider, "Preprod");
}

export async function getLucidBlockfrostInstance() {
    const provider = new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodAq47SEvsVpbW03U2DkjEBG908A5D7oFx");
    return await Lucid(provider, "Preprod");
}