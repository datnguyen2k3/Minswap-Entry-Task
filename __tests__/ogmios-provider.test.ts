import {OgmiosProvider} from "../src/ogmios/ogmios-provider";
import * as Ogmios from "@cardano-ogmios/client";
import {Blockfrost, UTxO} from "@lucid-evolution/lucid";
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
            expectedProtocolParameters.costModels = protocolParameters.costModels;
            expect(protocolParameters).toEqual(expectedProtocolParameters);
        });
    });

    describe("#getUtxos", () => {
        describe("with input is address", () => {
            let address: string = "addr_test1vrghqljgzecagulwt2x4vx42cjslf6xfxl8xrew3rlqxz8crj5as6";
            let expectedUtxos: UTxO[];

            beforeEach(async () => {
                expectedUtxos = await blockfrostProvider.getUtxos(address);
            });

            it("should return the expected utxos", async () => {
                const utxos = await ogmiosProvider.getUtxos(address);
                utxos.sort((a, b) =>
                    a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
                );
                expectedUtxos.sort((a, b) =>
                    a.txHash.localeCompare(b.txHash) || a.outputIndex - b.outputIndex
                );

                expect(utxos).toEqual(expectedUtxos);
            });
        });
    });
});