import {OgmiosProvider} from "../../src/ogmios/ogmios-provider";
import * as Ogmios from "@cardano-ogmios/client";
import {Blockfrost, OutRef, UTxO} from "@lucid-evolution/lucid";
import {ProtocolParameters} from "@lucid-evolution/lucid";
import {sortUTxO} from "../../src/ultis/math_ultis";

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

    function expectEqualUTxOs(utxos: UTxO[], expectedUtxos: UTxO[]) {
        sortUTxO(utxos);
        sortUTxO(expectedUtxos);
        expect(utxos).toEqual(expectedUtxos);
    }

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
                console.log(expectedUtxos);
            });

            it("should return the expected utxos", async () => {
                const utxos = await ogmiosProvider.getUtxos(address);

                expectEqualUTxOs(utxos, expectedUtxos);
            });
        });
    });

    describe("#getUtxosByOutRef", () => {
        let txHash: string = "070cbfc3d1139d09de80568126eacf4230b3b373be68042e08045905601aa163";
        let outputIndex: number = 0;
        let outRef: OutRef = {
            txHash: txHash,
            outputIndex: outputIndex
        };
        let outRefs: Array<OutRef> = [outRef];

        let expectedUtxos: UTxO[];

        beforeEach(async () => {
            expectedUtxos = await blockfrostProvider.getUtxosByOutRef(outRefs);
        });

        it("should return the expected utxos", async () => {
            const utxos = await ogmiosProvider.getUtxosByOutRef(outRefs);

            expectEqualUTxOs(utxos, expectedUtxos);
        });
    });
});