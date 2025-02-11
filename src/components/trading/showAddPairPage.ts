import {MainApp} from "../../main";
import {showTradingOptionsPage} from "./showTradingOptionsPage";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {findTokenBySymbol} from "../../repository/token-repository";
import {addPair, findPairByTokenSymbol, saveTradingPair} from "../../repository/trading-pair-repository";

export function showAddPairPage(mainApp: MainApp) {
    console.log();
    console.log('Add trading pair:');
    console.log('Press E to go back');
    enterTradeToken1(mainApp);
}

export function enterTradeToken1(mainApp: MainApp) {
    mainApp.getReadline().question(`Enter token symbol 1:`, async (tradeToken1) => {
        if (tradeToken1 === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (tradeToken1 === '') {
            showInvalidAnswer();
            enterTradeToken1(mainApp);
        } else if (tradeToken1 === 'ADA') {
            enterTradeToken2(tradeToken1, mainApp);
        } else {
            const token1 = await findTokenBySymbol(tradeToken1, mainApp.getDataSource());
            if (!token1) {
                console.log('Token not found, please try again');
                enterTradeToken1(mainApp);
            }
            enterTradeToken2(tradeToken1, mainApp);
        }
    });
}

function enterTradeToken2(resultTradeToken1: string, mainApp: MainApp) {
    mainApp.getReadline().question(`Enter token symbol 2:`, async (tradeToken2) => {
        if (tradeToken2 === 'E') {
            showTradingOptionsPage(mainApp);
            return;
        } else if (tradeToken2 === '') {
            showInvalidAnswer();
            enterTradeToken2(resultTradeToken1, mainApp);
            return;
        } else if (tradeToken2 === resultTradeToken1) {
            console.log('Token 2 must be different from token 1');
            enterTradeToken2(resultTradeToken1, mainApp);
            return;
        } else if (tradeToken2 !== 'ADA') {
            const token2 = await findTokenBySymbol(tradeToken2, mainApp.getDataSource());
            if (!token2) {
                console.log('Token not found, please try again');
                enterTradeToken1(mainApp);
                return;
            }
        }

        const pair = await findPairByTokenSymbol(resultTradeToken1, tradeToken2, mainApp.getDataSource());
        if (pair) {
            console.log('Trading pair already exists, please try again');
            enterTradeToken1(mainApp);
            return;
        }

        await addPair(resultTradeToken1, tradeToken2, mainApp.getDataSource());
        console.log('Trading pair added successfully');

        console.log('Press any key to go back');
        mainApp.getReadline().once('line', () => {
            showTradingOptionsPage(mainApp);
        });
    });
}