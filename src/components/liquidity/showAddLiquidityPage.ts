import {MainApp} from "../../main";
import {Token} from "../../entities/token";
import {UTxO} from "@lucid-evolution/lucid";
import {getAddedAdaByAddLiquidity, getFee} from "../../common/ultis";
import {Exchange} from "../../../dex/src/dex/exchange";
import {showSubmitTxWithPasswordPage} from "../showSubmitTxWithPasswordPage";
import {showLiquidityOptionsPage} from "./showLiquidityOptionsPage";
import {ADA_TO_LOVELACE} from "../../common/types";

export function showAddLiquidityPage(mainApp: MainApp, token: Token, assets: Map<string, number>, lpUtxo: UTxO) {
    if (!token.tradeName) {
        throw new Error('Token trade name not found');
    }

    const maxTokenAmount = assets.get(token.tradeName) || 0;
    const maxAdaAmount = assets.get('ADA') || 0;

    console.log('Press E to go back');
    mainApp.getReadline().question(`Enter the amount of token ${token.tradeName} to add in liquidity: `, async (amount) => {
        if (amount === 'E') {
            showLiquidityOptionsPage(mainApp);
            return;
        }

        if (isNaN(parseFloat(amount))) {
            console.log('Invalid amount');
            showAddLiquidityPage(mainApp, token, assets, lpUtxo);
            return;
        }

        const tokenAmount = parseFloat(amount);
        if (tokenAmount > maxTokenAmount) {
            console.log(`Insufficient balance of ${token.tradeName}, please try again`);
            showAddLiquidityPage(mainApp, token, assets, lpUtxo);
            return;
        }

        const adaAmount = Number(getAddedAdaByAddLiquidity(lpUtxo, tokenAmount, token.getContractName()));
        console.log(`You will need to added ${adaAmount} ADA`);
        if (adaAmount > maxAdaAmount) {
            console.log('Insufficient balance of ADA, please try again');
            showAddLiquidityPage(mainApp, token, assets, lpUtxo);
            return;
        }

        const lovelaceAmount = BigInt(adaAmount * ADA_TO_LOVELACE);
        const receivedLpAmount = Exchange.getLpTokenByAddedLiquidity(
            lpUtxo,
            lovelaceAmount,
            BigInt(tokenAmount),
            token.getContractName()
        );

        console.log(`You will receive ${receivedLpAmount} LP tokens`);
        const exchange = new Exchange(
            mainApp.getLucid(),
            mainApp.getPrivateKey(),
            mainApp.getAdminPublicKeyHash(),
            token.getAsset()
        );

        const tx = await exchange.createAddedLiquidityTx(
            lpUtxo,
            lovelaceAmount,
            BigInt(tokenAmount),
            receivedLpAmount
        );

        console.log('Fee:', getFee(tx), 'ADA');
        showSubmitTxWithPasswordPage(mainApp, tx, showLiquidityOptionsPage, mainApp);
    });
}

