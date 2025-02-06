import {MainApp} from "../../main";
import {showTradingOptionsPage} from "./showTradingOptionsPage";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {isValidPolicyId, saveLpToken} from "../../common/ultis";
import {findTokenByPolicyIdAndTokenName, saveToken} from "../../repository/token-repository";

export function showAddTokenPage(mainApp: MainApp) {
    console.log();
    console.log('Add token');
    console.log('Press E to go back');
    enterPolicyId(mainApp);
}

function enterPolicyId(mainApp: MainApp) {
    mainApp.getReadline().question(`Enter the policy id of the token:`, (policyId) => {
        if (policyId === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (!isValidPolicyId(policyId)) {
            showInvalidAnswer();
            enterPolicyId(mainApp);
        } else {
            enterTokenName(policyId, mainApp);
        }
    });
}

function enterTokenName(resultPolicyId: string, mainApp: MainApp) {
    mainApp.getReadline().question(`Enter the token name of the token:`, async (tokenName) => {
        if (tokenName === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (tokenName === '') {
            showInvalidAnswer();
            enterTokenName(resultPolicyId, mainApp);
        } else {
            const existToken = await findTokenByPolicyIdAndTokenName(resultPolicyId, tokenName, mainApp.getDataSource());
            if (existToken) {
                console.log('Token already exists, please try again');
                enterPolicyId(mainApp);
            }

            enterTokenSymbol(resultPolicyId, tokenName, mainApp);
        }
    });
}

function enterTokenSymbol(resultPolicyId: string, resultTokenName: string, mainApp: MainApp) {
    mainApp.getReadline().question(`Enter the token symbol of the token:`, async (tokenSymbol) => {
        if (tokenSymbol === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (tokenSymbol === '') {
            showInvalidAnswer();
            enterTokenSymbol(resultPolicyId, resultTokenName, mainApp);
        } else {
            const token = await saveToken(resultPolicyId, resultTokenName, tokenSymbol, mainApp.getDataSource());
            await saveLpToken(token, mainApp);
            console.log('Token added successfully');
            console.log();
            console.log('Press any key to go back');
            mainApp.getReadline().once('line', () => {
                showTradingOptionsPage(mainApp);
            });
        }
    });
}
