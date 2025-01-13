import {Blockfrost} from "@lucid-evolution/lucid";

export function getBlockfrostInstance() {
    return new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodAq47SEvsVpbW03U2DkjEBG908A5D7oFx");
}