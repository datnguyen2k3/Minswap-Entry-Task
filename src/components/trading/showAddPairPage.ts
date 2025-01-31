import {MainApp} from "../../main";
import {showTradingOptionsPage} from "./showTradingOptionsPage";
import {isValidPolicyId} from "../../common/ultis";
import {showInvalidAnswer} from "../showInvalidAnswer";

export function showAddPairPage(mainApp: MainApp) {
    console.log('Add trading pair:');
    let policyId1 = '';
    let policyId2 = '';
    let tokenName1 = '';
    let tokenName2 = '';

    enterTokenPolicy1(mainApp);
}

function enterTokenPolicy1(mainApp: MainApp): void {
    mainApp.getReadline().question(`Enter the policy id of token 1:`, (policyId: string) => {
        if (policyId === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (!isValidPolicyId(policyId)) {
            showInvalidAnswer();
            enterTokenPolicy1(mainApp);
        } else {
            enterTokenName1(policyId, mainApp);
        }
    });
}

function enterTokenName1(resultPolicyId1: string, mainApp: MainApp) {
    mainApp.getReadline().question(`Enter the token name of token 1:`, (tokenName: string) => {
        if (tokenName === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (tokenName === '') {
            showInvalidAnswer();
            enterTokenName1(resultPolicyId1, mainApp);
        } else {
            enterTokenPolicy2(resultPolicyId1, tokenName, mainApp);
        }
    })
}

function enterTokenPolicy2(resultPolicyId1: string, resultTokenName1: string, mainApp: MainApp): void {
    mainApp.getReadline().question(`Enter the policy id of token 2:`, (policyId: string) => {
        if (policyId === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (!isValidPolicyId(policyId)) {
            showInvalidAnswer();
            enterTokenPolicy2(resultPolicyId1, resultTokenName1, mainApp);
        } else {
            enterTokenName2(resultPolicyId1, resultTokenName1, policyId, mainApp);
        }
    });
}

function enterTokenName2(resultPolicyId1: string, resultTokenName1: string, resultPolicyId2: string, mainApp: MainApp) {
    mainApp.getReadline().question(`Enter the token name of token 2:`, (tokenName: string) => {
        if (tokenName === 'E') {
            showTradingOptionsPage(mainApp);
        } else if (tokenName === '') {
            showInvalidAnswer();
            enterTokenName2(resultPolicyId1, resultTokenName1, resultPolicyId2, mainApp);
        } else {
            console.log(resultPolicyId1, resultTokenName1, resultPolicyId2, resultPolicyId2);
        }
    })
}

