import {MainApp} from "../../main";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {showWalletInformationPage} from "./showWalletInformationPage";
import {showMainMenuPage} from "../showMainMenuPage";
import {showCreateNewWalletPage} from "./showCreateNewWalletPage";
import {showImportWalletPage} from "./showImportWalletPage";
import {showWithdrawPage} from "./showWithdrawPage";
import {showPasswordPage} from "./showPasswordPage";

const WALLET_INFORMATION = '1';
const CREATE_NEW_WALLET = '2';
const IMPORT_EXISTING_WALLET = '3';
const WITHDRAW = '4';
const PASSWORD = '5';
const GO_BACK = '6';

const SET_UP_ACCOUNT_QUETIONS =
`
Wallet options:
${WALLET_INFORMATION} - Wallet Information
${CREATE_NEW_WALLET} - Create a new wallet
${IMPORT_EXISTING_WALLET} - Import an existing wallet
${WITHDRAW} - Withdraw
${PASSWORD} - Change Password
${GO_BACK} - Go back
Enter your choice:`;

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
            case WITHDRAW:
                showWithdrawPage(mainApp);
                break;
            case PASSWORD:
                showPasswordPage(mainApp);
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
