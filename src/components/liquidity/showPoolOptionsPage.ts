import {MainApp} from "../../main";
import {Token} from "../../entities/token";
import {UTxO} from "@lucid-evolution/lucid";
import {
    showLiquidityOptionsPage
} from "./showLiquidityOptionsPage";
import {showAddLiquidityPage} from "./showAddLiquidityPage";
import {showRemoveLiquidityPage} from "./showRemoveLiquidityPage";

export async function showPoolOption(mainApp: MainApp, token: Token, assets: Map<string, number>, lpUtxo: UTxO) {
    console.log();
    console.log('Choose an option:');
    console.log('1. Add liquidity');
    console.log('2. Remove liquidity');
    console.log('3. Back');
    mainApp.getReadline().question('Enter your option: ', async (option) => {
        switch (option) {
            case '1':
                showAddLiquidityPage(mainApp, token, assets, lpUtxo);
                break;
            case '2':
                showRemoveLiquidityPage(mainApp, token, assets, lpUtxo);
                break;
            case '3':
                showLiquidityOptionsPage(mainApp);
                break;
            default:
                console.log('Invalid option');
                showPoolOption(mainApp, token, assets, lpUtxo);
        }
    });
}
