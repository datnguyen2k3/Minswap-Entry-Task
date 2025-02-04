import {TxSignBuilder} from "@lucid-evolution/lucid";
import {MainApp} from "../main";
import {createEncryptedPassword} from "../common/ultis";
import {submitTx} from "../../hello-world/common";

export function showSubmitTxWithPasswordPage(mainApp: MainApp, tx: TxSignBuilder, callback: (...args: any[]) => any, ...callbackArgs: any[]) {
    console.log();
    console.log('Press E to go back!');
    mainApp.getReadline().question('Enter your password to submit the transaction: ', async (inputPassword) => {
        if (mainApp.getEncryptedPassword() === '' || createEncryptedPassword(inputPassword, mainApp.getPrivateKey()) === mainApp.getEncryptedPassword()) {
            await submitTx(tx, mainApp.getLucid());
            console.log('Press any key to go back');
            mainApp.getReadline().once('line', () => {
                callback(...callbackArgs);
            });
        } else if (inputPassword === 'E') {
            callback(...callbackArgs);
        } else {
            console.log('Wrong password, please try again');
            showSubmitTxWithPasswordPage(mainApp, tx, callback, ...callbackArgs);
        }
    });
}