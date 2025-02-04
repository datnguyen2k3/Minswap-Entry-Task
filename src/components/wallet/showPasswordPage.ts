import {MainApp} from "../../main";
import {showWalletOptionsPage} from "./showWalletOptionsPage";
import {createEncryptedPassword, savePassword} from "../../common/ultis";

export function showPasswordPage(mainApp: MainApp) {
    console.log();
    console.log('Change password');
    console.log('Press E to go back');
    if (mainApp.getEncryptedPassword()) {
        enterOldPassword(mainApp);
    } else {
        enterNewPassword(mainApp);
    }
}

export function enterOldPassword(mainApp: MainApp) {
    mainApp.getReadline().question('Enter your old password: ', async (oldPassword) => {
        if (createEncryptedPassword(oldPassword, mainApp.getPrivateKey()) === mainApp.getEncryptedPassword()) {
            enterNewPassword(mainApp);
        } else if (oldPassword === 'E') {
            showWalletOptionsPage(mainApp);
        } else {
            console.log('Wrong password, please try again');
            enterOldPassword(mainApp);
        }
    });
}

export function enterNewPassword(mainApp: MainApp) {
    mainApp.getReadline().question('Enter your new password: ', async (newPassword) => {
        if (newPassword === '') {
            console.log('Password cannot be empty');
            enterNewPassword(mainApp);
        } else if (newPassword === 'E') {
            showWalletOptionsPage(mainApp);
        } else {
            enterConfirmPassword(mainApp, newPassword);
        }
    });
}

export function enterConfirmPassword(mainApp: MainApp, password: string) {
    mainApp.getReadline().question('Confirm your new password: ', async (confirmPassword) => {
        if (confirmPassword === password) {
            savePassword(password, mainApp.getPrivateKey());
            console.log('Password changed successfully');

            console.log('Press any key to go back');
            mainApp.getReadline().once('line', () => {
                showWalletOptionsPage(mainApp);
            });
        } else if (confirmPassword === 'E') {
            showWalletOptionsPage(mainApp);
        } else {
            console.log('Password does not match, please try again');
            enterConfirmPassword(mainApp, password);
        }
    });
}