import {MainApp} from "../main";
import {showInvalidAnswer} from "./showInvalidAnswer";
import {showWalletOptionsPage} from "./wallet/showWalletOptionsPage";
import {showTradingOptions} from "./trading/showTradingOptions";
import {showLiquidityOptions} from "./liquidity/showLiquidityOptions";

export const MAIN_MENU =
`
Main menu
1 - Wallet
2 - Trading
3 - Liquidity
4 - Exit
Enter your choice:`;

export const WALLET_OPTIONS = '1'
export const TRADING_OPTIONS = '2'
export const LIQUIDITY_OPTIONS = '3'
export const EXIT_OPTIONS = '4'


const OPTIONS_NEED_PRIVATE_KEY = [TRADING_OPTIONS, LIQUIDITY_OPTIONS];

export function showMainMenuPage(mainApp: MainApp) {
    mainApp.getReadline().question(MAIN_MENU, (answer: string) => {
        if (OPTIONS_NEED_PRIVATE_KEY.includes(answer) && mainApp.getPrivateKey() === undefined) {
            console.log('You need to set up your account first');
            showMainMenuPage(mainApp);
        }

        switch (answer) {
            case WALLET_OPTIONS:
                showWalletOptionsPage(mainApp);
                break;
            case TRADING_OPTIONS:
                showTradingOptions(mainApp);
                break;
            case LIQUIDITY_OPTIONS:
                showLiquidityOptions(mainApp);
                break;
            case EXIT_OPTIONS:
                mainApp.getReadline().close();
                process.exit(0);
            default:
                showInvalidAnswer();
                showMainMenuPage(mainApp);
                break;
        }
    });
}