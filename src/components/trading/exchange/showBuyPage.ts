import {MainApp} from "../../../main";
import {TradingPair} from "../../../entities/trading-pair";
import {enterSentAmount} from "./showEnterSentAmountPage";

export async function showBuyPage(mainApp: MainApp, pair: TradingPair) {
    await enterSentAmount(mainApp, pair);
}


