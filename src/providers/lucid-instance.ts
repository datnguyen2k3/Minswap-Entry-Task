import * as Ogmios from "@cardano-ogmios/client";
import {OgmiosProvider} from "./ogmios-provider";
import {Blockfrost, Lucid} from "@lucid-evolution/lucid";

export async function getLucidOgmiosInstance() {
    const provider = await OgmiosProvider.getInstance();
    return await Lucid(provider, "Preprod");
}

export async function getLucidBlockfrostInstance() {
    const provider = new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodAq47SEvsVpbW03U2DkjEBG908A5D7oFx");
    return await Lucid(provider, "Preprod");
}