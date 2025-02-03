import {MainApp} from "../../../main";
import {showMainMenuPage} from "../../showMainMenuPage";
import {showTradingOptionsPage} from "../showTradingOptionsPage";
import {showInvalidAnswer} from "../../showInvalidAnswer";
import {findPairByTokenSymbol} from "../../../repository/trading-pair-repository";
import {showPairOptionPage} from "./showPairOptionPage";

export function showEnterPairPage(mainApp: MainApp) {
    console.log();
    console.log('Press E to go back!')
    mainApp.getReadline().question(`Enter trading pair:`, async (tradingPair) => {
        if (tradingPair === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (tradingPair === '') {
            showInvalidAnswer();
            showEnterPairPage(mainApp);
        } else {
            const tradingPairArray = tradingPair.split('-');
            if (tradingPairArray.length !== 2) {
                showInvalidAnswer();
                showEnterPairPage(mainApp);
            }

            const pair = await findPairByTokenSymbol(tradingPairArray[0], tradingPairArray[1], mainApp.getDataSource());
            if (!pair) {
                console.log('Trading pair not found, please try again');
                showEnterPairPage(mainApp);
            } else {
                await showPairOptionPage(pair, mainApp);
            }
        }
    });
}