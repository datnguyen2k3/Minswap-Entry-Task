import {MainApp} from "../../main";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {showWalletInformationPage} from "./showWalletInformationPage";
import {showMainMenuPage} from "../showMainMenuPage";
import {showCreateNewWalletPage} from "./showCreateNewWalletPage";
import {showImportWalletPage} from "./showImportWalletPage";

const SET_UP_ACCOUNT_QUETIONS =
`
Wallet options:
1 - Wallet Information
2 - Create a new wallet
3 - Import an existing wallet
4 - Go back
Enter your choice:`;

const WALLET_INFORMATION = '1';
const CREATE_NEW_WALLET = '2';
const IMPORT_EXISTING_WALLET = '3';
const GO_BACK = '4';

export function showWalletOptionsPage(mainApp: MainApp) {
    mainApp.getReadline().question(SET_UP_ACCOUNT_QUETIONS, async (answer: string) => {
        switch (answer) {
            case WALLET_INFORMATION:
                await showWalletInformationPage(mainApp)
                break;
            case CREATE_NEW_WALLET:
                showCreateNewWalletPage(mainApp);
                break;
            case IMPORT_EXISTING_WALLET:
                showImportWalletPage(mainApp);
                break;
            case GO_BACK:
                showMainMenuPage(mainApp);
                break;
            default:
                showInvalidAnswer();
                showWalletOptionsPage(mainApp);
                break;
        }
    });
}
