import {MainApp} from "../../main";
import {showMainMenuPage} from "../showMainMenuPage";
import {findPairByTokenSymbol} from "../../repository/trading-pair-repository";
import {getAssets, getLpContractName} from "../../common/ultis";
import {findTokenBySymbol} from "../../repository/token-repository";
import {Exchange} from "../../../dex/src/dex/exchange";
import {ADA_TO_LOVELACE} from "../../common/types";

export function showLiquidityOptions(mainApp: MainApp) {
    enterLiquidityPool(mainApp);
}

export function enterLiquidityPool(mainApp: MainApp) {
    console.log();
    console.log('Press E to go back');
    mainApp.getReadline().question('Enter the token to add in liquidity: ', async (token) => {
        if (token === 'E') {
            showMainMenuPage(mainApp);
        } else {
            const pair = await findPairByTokenSymbol(token, 'ADA', mainApp.getDataSource());
            if (!pair) {
                console.log('Liquid pool not found, please try again');
                enterLiquidityPool(mainApp);
            } else {
                showPoolOptions(mainApp, token);
            }
        }
    });
}

export async function showPoolOptions(mainApp: MainApp, tokenSymbol: string) {
    const token = await findTokenBySymbol(tokenSymbol, mainApp.getDataSource());
    if (!token) {
        throw new Error('Token not found');
    }
    const assets = await getAssets(await mainApp.getAddress(), mainApp);

    const maxTokenAmount = assets.get(tokenSymbol) || 0;
    const maxLpAmount = assets.get(getLpContractName(token, mainApp.getAdminPublicKeyHash())) || 0;
    const maxAdaAmount = assets.get('ADA') || 0;


    const lpUtxo = await Exchange.getLiquidityPoolUTxO(
        mainApp.getLucid(),
        mainApp.getAdminPublicKeyHash(),
        token.getAsset(),
    );

    console.log(`Pool ${tokenSymbol}-ADA has:`)
    console.log(`\t${tokenSymbol}: ${Number(lpUtxo.assets[token.getContractName()])}`);
    console.log(`\tADA: ${Number(lpUtxo.assets['lovelace']) / ADA_TO_LOVELACE}`);
    console.log(`\tLP tokens supply: ${Exchange.getTotalSupply(lpUtxo)}`);
    console.log(`Your balance: ${maxTokenAmount} ${tokenSymbol}, ${maxAdaAmount} ADA, ${maxLpAmount} ${tokenSymbol}-ADA LP tokens`);


    // mainApp.getReadline().question(`Enter the amount of token ${tokenSymbol} to add in liquidity: `, async (amount) => {
    //     if (amount === 'E') {
    //         showLiquidityOptions(mainApp);
    //     } else if (isNaN(parseFloat(amount))) {
    //         console.log('Invalid amount');
    //         enterAmount(mainApp, tokenSymbol);
    //     } else {
    //         const tokenAmount = parseFloat(amount);
    //         if (tokenAmount > maxAmount) {
    //             console.log(`Insufficient balance of ${tokenSymbol}, please try again`);
    //             enterAmount(mainApp, tokenSymbol);
    //         } else {
    //
    //
    //
    //
    //             const adaAmount = getAddedAdaByAddLiquidity(lpUtxo, tokenAmount, token.getContractName());
    //             console.log(`You will need to added ${adaAmount} ADA`);
    //             if (adaAmount > (assets.get('ADA') ||  0)) {
    //                 console.log('Insufficient balance of ADA, please try again');
    //                 enterAmount(mainApp, tokenSymbol);
    //             } else {
    //
    //             }
    //         }
    //     }
    // });
}