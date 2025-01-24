import {MainApp} from "../../main";
import {showWalletOptionsPage} from "./showWalletOptionsPage";
import {getAssets} from "../../common/ultis";



export async function showWalletInformationPage(mainApp: MainApp) {
    console.log();
    console.log('Your wallet information:');
    console.log();
    console.log('Address:', await mainApp.getAddress());
    console.log('Assets:');

    const assets = await getAssets(
        await mainApp.getAddress(),
        mainApp.getLucid()
    )

    for (const [assetName, value] of assets) {
        console.log("   " + assetName + ":", value);
    }
    console.log()
    console.log('Press any key to go back');
    mainApp.getReadline().once('line', () => {
        showWalletOptionsPage(mainApp);
    });
}