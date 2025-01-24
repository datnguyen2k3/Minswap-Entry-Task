import {MainApp} from "../../main";

export function showAddPairPage(mainApp: MainApp) {
    console.log('Add trading pair:');
    let policyId1 = '';
    let policyId2 = '';
    let tokenName1 = '';
    let tokenName2 = '';

    mainApp.getReadline().question('Enter the policy id of token 1:', (policyId: string) => {

    });
}