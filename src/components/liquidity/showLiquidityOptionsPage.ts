import {MainApp} from "../../main";
import {showMainMenuPage} from "../showMainMenuPage";
import {findPairByTokenSymbol} from "../../repository/trading-pair-repository";
import {getAddedAdaByAddLiquidity, getAssets, getFee, getLpContractName} from "../../common/ultis";
import {findTokenBySymbol} from "../../repository/token-repository";
import {Exchange} from "../../../dex/src/dex/exchange";
import {ADA_TO_LOVELACE} from "../../common/types";
import {Token} from "../../entities/token";
import {UTxO} from "@lucid-evolution/lucid";
import {showSubmitTxWithPasswordPage} from "../showSubmitTxWithPasswordPage";
import {showPool} from "./showPoolPage";

export function showLiquidityOptionsPage(mainApp: MainApp) {
    console.log();
    console.log('Liquidity pool');
    enterLiquidityPool(mainApp);
}

export function enterLiquidityPool(mainApp: MainApp) {
    console.log('Press E to go back');
    mainApp.getReadline().question('Enter the token of liquidity pool: ', async (token) => {
        if (token === 'E') {
            showMainMenuPage(mainApp);
        } else {
            const pair = await findPairByTokenSymbol(token, 'ADA', mainApp.getDataSource());
            if (!pair) {
                console.log('Liquid pool not found, please try again');
                enterLiquidityPool(mainApp);
            } else {
                showPool(mainApp, token);
            }
        }
    });
}






