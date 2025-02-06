import {MainApp} from "../../main";
import {findTokenBySymbol} from "../../repository/token-repository";
import {getAssets, getLpContractName} from "../../common/ultis";
import {Exchange} from "../../../dex/src/dex/exchange";
import {ADA_TO_LOVELACE} from "../../common/types";
import {showPoolOption} from "./showPoolOptionsPage";

export async function showPool(mainApp: MainApp, tokenSymbol: string) {
    const token = await findTokenBySymbol(tokenSymbol, mainApp.getDataSource());
    if (!token) {
        throw new Error('Token not found');
    }
    const assets = await getAssets(await mainApp.getAddress(), mainApp);

    const maxTokenAmount = assets.get(tokenSymbol) || 0;
    const maxLpAmount = assets.get(`${tokenSymbol}-ADA`) || 0;
    const maxAdaAmount = assets.get('ADA') || 0;


    const lpUtxo = await Exchange.getLiquidityPoolUTxO(
        mainApp.getLucid(),
        mainApp.getAdminPublicKeyHash(),
        token.getAsset(),
    );

    console.log(`Pool ${tokenSymbol}-ADA has:`)
    console.log(`    ${tokenSymbol}: ${Number(lpUtxo.assets[token.getContractName()])}`);
    console.log(`    ADA: ${Number(lpUtxo.assets['lovelace']) / ADA_TO_LOVELACE}`);
    console.log(`    LP tokens supply: ${Exchange.getTotalSupply(lpUtxo)}`);
    console.log(`Your balance: ${maxTokenAmount} ${tokenSymbol}, ${maxAdaAmount} ADA, ${maxLpAmount} ${tokenSymbol}-ADA LP tokens`);
    showPoolOption(mainApp, token, assets, lpUtxo);
}