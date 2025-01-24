import {MainApp} from "../../main";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {showWalletInformationPage} from "./showWalletInformationPage";
import {showMainMenuPage} from "../showMainMenuPage";
import {showCreateNewWalletPage} from "./showCreateNewWalletPage";

const SET_UP_ACCOUNT_QUETIONS =
`
Account:
1 - Account Information
2 - Create a new wallet
3 - Import an existing wallet
4 - Go back
Enter your choice:`;

const ACCOUNT_INFORMATION = '1';
const CREATE_NEW_WALLET = '2';
const IMPORT_EXISTING_WALLET = '3';
const GO_BACK = '4';

export function showWalletOptionsPage(mainApp: MainApp) {
    mainApp.getReadline().question(SET_UP_ACCOUNT_QUETIONS, async (answer: string) => {
        switch (answer) {
            case ACCOUNT_INFORMATION:
                await showWalletInformationPage(mainApp)
                break;
            case CREATE_NEW_WALLET:
                showCreateNewWalletPage(mainApp);
                break;
            case IMPORT_EXISTING_WALLET:
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