import {OgmiosProvider} from "../src/ogmios/ogmios-provider";
import * as Ogmios from "@cardano-ogmios/client";
import {Blockfrost} from "@lucid-evolution/lucid";
import {ProtocolParameters} from "@lucid-evolution/lucid";

describe("#OgmiosProvider", () => {
    let ogmiosProvider: OgmiosProvider;
    let blockfrostProvider: Blockfrost;

    beforeEach(async () => {
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

        ogmiosProvider = new OgmiosProvider(context);
        blockfrostProvider = new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodAq47SEvsVpbW03U2DkjEBG908A5D7oFx");
    });

    describe("#getProtocolParameters", () => {
        let expectedProtocolParameters: ProtocolParameters;

        beforeEach(async () => {
            expectedProtocolParameters = await blockfrostProvider.getProtocolParameters();
        });

        it("should return the expected protocol parameters", async () => {
            const protocolParameters = await ogmiosProvider.getProtocolParameters();
            expect(protocolParameters).toEqual(expectedProtocolParameters);
        });
    });

});