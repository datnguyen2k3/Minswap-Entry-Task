import {MainApp} from "../../../main";
import {TradingPair} from "../../../entities/trading-pair";
import {enterSentAmount} from "./showEnterSentAmountPage";

export async function showSellPage(mainApp: MainApp, pair: TradingPair) {
    if (!pair.tokenTradeName1 || !pair.tokenTradeName2) {
        throw new Error('Invalid trading pair');
    }

    [pair.tokenTradeName1, pair.tokenTradeName2] = [pair.tokenTradeName2, pair.tokenTradeName1];
    await enterSentAmount(mainApp, pair);
}