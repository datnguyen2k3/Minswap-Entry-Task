import {MainApp} from "../../../main";
import {TradingPair} from "../../../entities/trading-pair";
import {showPairOption} from "./showPairOption";
import {createSwapTx, getAssets, getFee, getReceivedTokenFrom} from "../../../common/ultis";
import {Exchange} from "../../../../dex/src/dex/exchange";
import {TxSignBuilder} from "@lucid-evolution/lucid";
import {submitTx} from "../../../../hello-world/common";

export async function showBuyPage(mainApp: MainApp, pair: TradingPair) {
    await enterToken2Amount(mainApp, pair);
}

export async function enterToken2Amount(mainApp: MainApp, pair: TradingPair) {
    console.log();
    console.log('Press E to go back!')
    const assets = await getAssets(await mainApp.getAddress(),  mainApp);
    const sentToken = pair.tokenTradeName2;
    const receivedToken = pair.tokenTradeName1;

    if (!sentToken || !receivedToken) {
        throw new Error('Invalid trading pair');
    }

    const maxAmount = assets.get(sentToken) || 0;
    console.log(`Your balance: ${maxAmount} ${sentToken}`);


    mainApp.getReadline().question(`Enter amount of ${sentToken}:`, async (amount) => {
        if (amount === 'E') {
            await showPairOption(pair, mainApp);
        } else if (isNaN(parseFloat(amount))) {
            console.log('Invalid amount');
            await enterToken2Amount(mainApp, pair);
        } else {
            const sentAmount = parseFloat(amount);

            if (sentAmount > maxAmount) {
                console.log('Insufficient balance');
                await enterToken2Amount(mainApp, pair);
            } else {

                const receivedAmount = await getReceivedTokenFrom(sentToken, sentAmount, receivedToken, mainApp);
                const tx = await createSwapTx(mainApp, sentToken, receivedToken, sentAmount, receivedAmount);
                const fee = getFee(tx);

                console.log(`You will receive: ${receivedAmount} ${receivedToken}`);
                console.log(`Fee: ${getFee(tx)} ADA`);

                if (fee + sentAmount > maxAmount) {
                    console.log('Your balance is not enough to pay for the fee, please try again');
                    await enterToken2Amount(mainApp, pair);
                }

                confirmBuy(mainApp, pair, tx);
            }
        }
    });
}

export function confirmBuy(mainApp: MainApp, pair: TradingPair, tx: TxSignBuilder) {
    console.log('Press Y to confirm, E to cancel');
    mainApp.getReadline().question(`Confirm?`, async (confirm) => {
        if (confirm === 'Y') {
            await submitTx(tx, mainApp.getLucid());
            console.log('Press any key to continue');

            mainApp.getReadline().question(``, async () => {
                await showPairOption(pair, mainApp);
            });
        } else if (confirm === 'E') {
            await enterToken2Amount(mainApp, pair);
        } else {
            console.log('Invalid answer');
            await enterToken2Amount(mainApp, pair);
        }
    });
}
