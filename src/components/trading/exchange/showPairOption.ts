import {TradingPair} from "../../../entities/trading-pair";
import {MainApp} from "../../../main";
import {getPrice} from "../../../common/ultis";
import {showTradingOptionsPage} from "../showTradingOptionsPage";

export async function showPairOption(pair: TradingPair, mainApp: MainApp) {
    console.log()
    console.log(`Pair: ${pair.tokenTradeName1}-${pair.tokenTradeName2}`);
    if (!pair.tokenTradeName1 || !pair.tokenTradeName2) {
        console.log('Invalid trading pair');
        showTradingOptionsPage(mainApp);
    } else {
        console.log(`Price: ${await getPrice(mainApp, pair.tokenTradeName1, pair.tokenTradeName2)}`);
    }

    console.log("Choose your option:");
    console.log("1 - Buy");
    console.log("2 - Sell");
    console.log("3 - Back");
}