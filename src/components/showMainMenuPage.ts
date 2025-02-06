import {MainApp} from "../main";
import {showInvalidAnswer} from "./showInvalidAnswer";
import {showWalletOptionsPage} from "./wallet/showWalletOptionsPage";
import {showTradingOptionsPage} from "./trading/showTradingOptionsPage";
import {showLiquidityOptionsPage} from "./liquidity/showLiquidityOptionsPage";

export const MAIN_MENU =
`
Main menu
1 - Wallet
2 - Market
3 - Liquidity
4 - Exit
Enter your choice:`;

export const WALLET_OPTIONS = '1'
export const MARKET_OPTIONS = '2'
export const LIQUIDITY_OPTIONS = '3'
export const EXIT_OPTIONS = '4'


const OPTIONS_NEED_PRIVATE_KEY = [MARKET_OPTIONS, LIQUIDITY_OPTIONS];

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
            case MARKET_OPTIONS:
                showTradingOptionsPage(mainApp);
                break;
            case LIQUIDITY_OPTIONS:
                showLiquidityOptionsPage(mainApp);
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