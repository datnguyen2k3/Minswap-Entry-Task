import {MainApp} from "../../../main";
import {TradingPair} from "../../../entities/trading-pair";
import {createSwapTx, getAssets, getFee, getReceivedTokenFrom} from "../../../common/ultis";
import {showPairOptionPage} from "./showPairOptionPage";
import {TxSignBuilder} from "@lucid-evolution/lucid";
import {submitTx} from "../../../../hello-world/common";
import {showSubmitTxWithPasswordPage} from "../../showSubmitTxWithPasswordPage";

export async function enterSentAmount(mainApp: MainApp, pair: TradingPair) {
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
            await showPairOptionPage(pair, mainApp);
        } else if (isNaN(parseFloat(amount))) {
            console.log('Invalid amount');
            await enterSentAmount(mainApp, pair);
        } else {
            const sentAmount = parseFloat(amount);

            if (sentAmount > maxAmount) {
                console.log('Insufficient balance');
                await enterSentAmount(mainApp, pair);
            } else {

                const receivedAmount = await getReceivedTokenFrom(sentToken, sentAmount, receivedToken, mainApp);
                const tx = await createSwapTx(mainApp, sentToken, receivedToken, sentAmount, receivedAmount);
                const fee = getFee(tx);

                console.log(`You will receive: ${receivedAmount} ${receivedToken}`);
                console.log(`Fee: ${getFee(tx)} ADA`);

                if (fee + sentAmount > maxAmount) {
                    console.log('Your balance is not enough to pay for the fee, please try again');
                    await enterSentAmount(mainApp, pair);
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
            showSubmitTxWithPasswordPage(mainApp, tx, showPairOptionPage, pair, mainApp);
        } else if (confirm === 'E') {
            await enterSentAmount(mainApp, pair);
        } else {
            console.log('Invalid answer');
            await enterSentAmount(mainApp, pair);
        }
    });
}
