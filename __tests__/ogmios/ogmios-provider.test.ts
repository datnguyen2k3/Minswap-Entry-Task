import {OgmiosProvider} from "../../src/providers/ogmios-provider";
import * as Ogmios from "@cardano-ogmios/client";
import {Blockfrost, Credential, Lucid, LucidEvolution, OutRef, UTxO} from "@lucid-evolution/lucid";
import {ProtocolParameters} from "@lucid-evolution/lucid";
import {sortUTxO} from "../../src/common/ultis";

describe("#OgmiosProvider", () => {
    let ogmiosProvider: OgmiosProvider;
    let blockfrostProvider: Blockfrost;
    let ogmiosLucid: LucidEvolution;
    let blockfrostLucid: LucidEvolution;

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

        ogmiosLucid = await Lucid(ogmiosProvider, "Preprod");
        blockfrostLucid = await Lucid(blockfrostProvider, "Preprod");
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
            let address: string = "addr_test1vqe33tv0p36r5e6gx8tfunrpcrvqtmdxjkc0yzj07rk7h3gp7wqvu";
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

        describe("with output is UTxO has script", () => {
            let address: string = "addr_test1wqn7wnkhny2j475ac709vg3kw6wf59f3hdl3htfpwg8xmtqtxyz6a";
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

        describe("with input is credential", () => {
            let credential: Credential = {
                type: "Script",
                hash: "635fb467081a4b83c005606329babeb9efa3e0445f520d6b222ff993"
            }
            let expectedUtxos: UTxO[];

            beforeEach(async () => {
                expectedUtxos = await blockfrostProvider.getUtxos(credential);
                console.log(expectedUtxos);
            });

            it("should return the expected utxos", async () => {
                const utxos = await ogmiosProvider.getUtxos(credential);

                expectEqualUTxOs(utxos, expectedUtxos);
            });
        });
    });

    describe("#getUtxosByOutRef", () => {
        let txHash: string = "9d0758b091773267185c44255d4589728eff584491c97f8560f343ea32d05509";
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

    describe("#awaitTx", () => {
        describe("with input is existed txHash", () => {
            let txHash: string = "c79107142bb183e2784501aa809e8b1de22b3c9c6c48b86127e610d46606c310";

            it("should return true", async () => {
                const tx = await ogmiosProvider.awaitTx(txHash, 1000);
                expect(tx).toEqual(true);
            });
        });

        describe("with input is not existed txHash", () => {
            let txHash: string = "070cbfc3d1139d09de80568126eacf4230b3b373be68042e08045905601aa164";

            it("should return false", async () => {
                const tx = await ogmiosProvider.awaitTx(txHash, 2);
                expect(tx).toEqual(false);
            });
        });
    });

    describe("#evaluateTx", () => {
        let TxCbor: string = "84a800d9010284825820268fad3e2f3094f61bf137b6a4f228bf614616af3c0d9a641b5b8fdbff2b0156008258209c1723efa4c5a75061842f5d322444951ef1ee6279072084f63de224c6040d3100825820acb68fb35f3657fffa165da342635f600becdce0b3eb9cba2f54fdc1e742ef9a00825820d2e1041c1131d4d54e5d9bce01af57867d2555ec7a4ec6111f07a9f1a534c2b100018282581d605309fa786856c1262d095b89adf64fe8a5255ad19142c9c537359e411a000f424082581d60fe86d294baa6413b4068e2c42f4412c61dc5b4fc69542a41dc89f6b01a002cc2de021a00031d620b5820a73571c0e738f233de88230565f07da8a3d4f06ed8ccce7c35317fa60c5623f00dd9010281825820d2e1041c1131d4d54e5d9bce01af57867d2555ec7a4ec6111f07a9f1a534c2b1010ed9010281581cfe86d294baa6413b4068e2c42f4412c61dc5b4fc69542a41dc89f6b01082581d60fe86d294baa6413b4068e2c42f4412c61dc5b4fc69542a41dc89f6b01b0000000252d47cbe111a004c4b40a300d90102818258201893dedca8b81fd13f168affbdee6500fce0e7f114a38576517ba4400295fdb65840343e4760d86cddad1847af12b29b7583e4f6308beea1d1c8c5d679ce0b52499c7032e4c89a95d059f710c2d88b033c3167dea68a2e30ae28b55fc69cc1245a040584840000d8799f4d48656c6c6f2c20576f726c6421ff82196f1b1a0088b3a4840001d8799f4d48656c6c6f2c20576f726c6421ff82196f1b1a0088b3a4840002d8799f4d48656c6c6f2c20576f726c6421ff82196f1b1a0088b3a4840003d8799f4d48656c6c6f2c20576f726c6421ff82196f1b1a0088b3a407d901028159010959010601010032323232323225333002323232323253330073370e900118041baa0011323322533300a3370e900018059baa00513232533300f30110021533300c3370e900018069baa003132533300d3371e6eb8c044c03cdd50042450d48656c6c6f2c20576f726c642100100114a06644646600200200644a66602600229404cc894ccc048cdc78010028a51133004004001375c6028002602a0026eb0c040c044c044c044c044c044c044c044c044c038dd50041bae3010300e37546020601c6ea800c5858dd7180780098061baa00516300c001300c300d001300937540022c6014601600660120046010004601000260086ea8004526136565734aae7555cf2ab9f5742ae881f5f6"

       describe("with input is scripts tx", () => {
           it ("should return the expected result", async () => {
                const ogmiosEvalRedeemer = await ogmiosProvider.evaluateTx(TxCbor);
                const blockfrostEvalRedeemer = await blockfrostProvider.evaluateTx(TxCbor);

                expect(ogmiosEvalRedeemer).toEqual(blockfrostEvalRedeemer);
           });
       });
    });
});