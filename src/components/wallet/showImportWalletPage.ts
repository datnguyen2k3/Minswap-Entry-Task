import {MainApp} from "../../main";
import {generatePrivateKey} from "@lucid-evolution/lucid";
import {getAddress, saveKeyFrom} from "../../../hello-world/common";
import {showWalletOptionsPage} from "./showWalletOptionsPage";
import {validatePrivateKey} from "../../common/ultis";
import {PRIVATE_KEY_PATH} from "../../common/types";

export function showImportWalletPage(mainApp: MainApp) {
    console.log();
    console.log('Import Existed Wallet');
    console.log('Press B to go back');
    mainApp.getReadline().question('Enter your private key: ', async (privateKey) => {
        if (privateKey.toUpperCase() === 'B') {
            showWalletOptionsPage(mainApp);
        } else if (!validatePrivateKey(privateKey)) {
            console.log('Invalid private key, please try again');
            showImportWalletPage(mainApp);
        } else {
            saveKeyFrom(privateKey, PRIVATE_KEY_PATH);
            console.log('Imported wallet successfully');
            console.log();
            console.log('Press any key to go back');

            mainApp.getReadline().once('line', () => {
                showWalletOptionsPage(mainApp);
            });
        }
    });
}
