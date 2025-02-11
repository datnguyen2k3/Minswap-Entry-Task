import {MainApp} from "../../main";
import {Token} from "../../entities/token";
import {UTxO} from "@lucid-evolution/lucid";
import {showPool} from "./showPoolPage";
import {Exchange} from "../../../dex/src/dex/exchange";
import {ADA_TO_LOVELACE} from "../../common/types";
import {getFee} from "../../common/ultis";
import {showSubmitTxWithPasswordPage} from "../showSubmitTxWithPasswordPage";

export function showRemoveLiquidityPage(mainApp: MainApp, token: Token, assets: Map<string, number>, lpUtxo: UTxO) {
    console.log('Press E to go back');
    mainApp.getReadline().question(`Enter the amount of LP token to remove: `, async (amount) => {
        if (amount === 'E') {
            if (!token.tradeName) {
                throw new Error('Token trade name not found');
            }
            showPool(mainApp, token.tradeName);
            return;
        }

        if (isNaN(parseFloat(amount))) {
            console.log('Invalid amount');
            showRemoveLiquidityPage(mainApp, token, assets, lpUtxo);
            return;
        }

        const lpAmount = parseFloat(amount);
        const maxLpAmount = assets.get(`${token.tradeName}-ADA`) || 0;
        if (lpAmount > maxLpAmount) {
            console.log(`Insufficient balance of LP token, please try again`);
            showRemoveLiquidityPage(mainApp, token, assets, lpUtxo);
            return;
        }

        const exchange = new Exchange(
            mainApp.getLucid(),
            mainApp.getPrivateKey(),
            mainApp.getAdminPublicKeyHash(),
            token.getAsset()
        );

        const lovelaceAmount = Exchange.getRemovedLoveLaceByRemovedLpToken(
            lpUtxo,
            BigInt(lpAmount),
        );
        console.log(`You will receive ${Number(lovelaceAmount) / ADA_TO_LOVELACE} ADA`);

        const tokenAmount = Exchange.getRemovedTradeTokenByRemovedLpToken(
            lpUtxo,
            BigInt(lpAmount),
            token.getContractName()
        );
        console.log(`You will receive ${Number(tokenAmount)} ${token.tradeName}`);

        const tx = await exchange.createRemoveLiquidityTx(lpUtxo, BigInt(lpAmount), lovelaceAmount, tokenAmount);
        console.log(`Fee: ${getFee(tx)} ADA`);
        showSubmitTxWithPasswordPage(mainApp, tx, showRemoveLiquidityPage, mainApp, token, assets, lpUtxo);
    });
}
