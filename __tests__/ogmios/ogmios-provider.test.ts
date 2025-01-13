import {OgmiosProvider} from "../../src/ogmios/ogmios-provider";
import * as Ogmios from "@cardano-ogmios/client";
import {Blockfrost, Constr, Data, Lucid, LucidEvolution, OutRef, UTxO} from "@lucid-evolution/lucid";
import {ProtocolParameters} from "@lucid-evolution/lucid";
import {sortUTxO} from "../../src/ultis/math_ultis";
import {getPrivateKey, getPublicKeyHash, getScriptsAddress} from "../../hello-world/common";

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

                expectEqualUTxOs(utxos, expectedUtxos); // TODO: Fix scripts data
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

    describe("#evaluateTx", () => { // TODO: Fix this test
       describe("with input is scripts tx", () => {
           it ("should return the expected result", async () => {
                ogmiosLucid.selectWallet.fromPrivateKey(getPrivateKey());
                blockfrostLucid.selectWallet.fromPrivateKey(getPrivateKey());

                const scriptAddress = getScriptsAddress();
                const publicKeyHash = await getPublicKeyHash();
                const datum = Data.to(new Constr(0, [publicKeyHash]));
                const amount = 1000000;

                const ogmiosTx = await ogmiosLucid
                    .newTx()
                    .pay.ToAddressWithData(
                        scriptAddress,
                        {kind: "inline", value: datum},
                        {lovelace: BigInt(amount)}
                    )
                    .complete();

                const blockfrostTx = await blockfrostLucid
                    .newTx()
                    .pay.ToAddressWithData(
                        scriptAddress,
                        {kind: "inline", value: datum},
                        {lovelace: BigInt(amount)}
                    )
                    .complete();

                const signedOgmiosTx = await ogmiosTx.sign.withWallet().complete();
                const signedBlockfrostTx = await blockfrostTx.sign.withWallet().complete();

                const ogmiosEvalRedeemer = await ogmiosProvider.evaluateTx(signedOgmiosTx.toTransaction().to_cbor_hex());
                const blockfrostEvalRedeemer = await blockfrostProvider.evaluateTx(signedBlockfrostTx.toTransaction().to_cbor_hex());

                expect(ogmiosEvalRedeemer).toEqual(blockfrostEvalRedeemer);
           });
       });
    });
});