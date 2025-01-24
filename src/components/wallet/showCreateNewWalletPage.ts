import {MainApp} from "../../main";
import {generatePrivateKey} from "@lucid-evolution/lucid";
import {getAddress} from "../../../hello-world/common";
import {showWalletOptionsPage} from "./showWalletOptionsPage";

export function showCreateNewWalletPage(mainApp: MainApp) {
    const privateKey = generatePrivateKey();
    const address = getAddress(privateKey);

    console.log();
    console.log('Your New Wallet:');
    console.log('Private Key:', privateKey);
    console.log('Address:', address);
    console.log();
    console.log('Press any key to go back');

    mainApp.getReadline().once('line', () => {
        showWalletOptionsPage(mainApp);
    });
}
