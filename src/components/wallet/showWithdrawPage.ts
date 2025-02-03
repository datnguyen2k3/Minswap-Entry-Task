import {MainApp} from "../../main";
import {findTokenBySymbol} from "../../repository/token-repository";
import {getAssets, getFee, isValidAddress} from "../../common/ultis";
import {submitTx} from "../../../hello-world/common";
import {showWalletOptionsPage} from "./showWalletOptionsPage";

export function showWithdrawPage(mainApp: MainApp) {
    console.log();
    console.log('Withdraw');
    console.log('Press E to go back!');
    enterToken(mainApp);

}

export function enterToken(mainApp: MainApp) {
    mainApp.getReadline().question(`Enter token:`, async (tokenSymbol) => {
        const asset = await getAssets(await mainApp.getAddress(), mainApp);

        if (tokenSymbol === 'E') {
            showWalletOptionsPage(mainApp);
        } else if (asset.has(tokenSymbol)) {
            enterReceiver(mainApp, tokenSymbol, asset.get(tokenSymbol) || 0);
        } else {
            console.log('Not found token, please try again');
            enterToken(mainApp);
        }
    });
}

export function enterReceiver(mainApp: MainApp, tokenSymbol: string, maxAmount: number) {
    mainApp.getReadline().question(`Enter receiver:`, async (receiver) => {
        if (receiver === 'E') {
            showWalletOptionsPage(mainApp);
        } else if (!isValidAddress(receiver)) {
            console.log('Invalid address, please try again');
            enterReceiver(mainApp, tokenSymbol, maxAmount);
        } else {
            enterAmount(mainApp, maxAmount, tokenSymbol, receiver);
        }
    });

}

export function enterAmount(mainApp: MainApp, maxAmount: number, tokenSymbol: string, receiver: string) {
    console.log('Your balance:', maxAmount, tokenSymbol);
    mainApp.getReadline().question(`Enter amount:`, async (amount) => {
        if (amount === 'E') {
            showWalletOptionsPage(mainApp);
        } else if (isNaN(parseFloat(amount))) {
            console.log('Invalid amount');
            enterAmount(mainApp, maxAmount, tokenSymbol, receiver);
        } else {
            const withdrawAmount = parseFloat(amount);
            if (withdrawAmount > maxAmount) {
                console.log('Insufficient balance, please try again');
                enterAmount(mainApp, maxAmount, tokenSymbol, receiver);
            } else {
                const token = await findTokenBySymbol(tokenSymbol, mainApp.getDataSource());
                const tokenName = token?.getContractName() || (tokenSymbol == 'ADA' ? 'lovelace' : tokenSymbol);

                const tx = await mainApp.getLucid()
                    .newTx()
                    .pay.ToAddress(
                        receiver,
                        {
                            [tokenName]: BigInt(withdrawAmount)
                        }
                    )
                    .complete();

                console.log(`Fee: ${getFee(tx)} ADA`);
                console.log(`Sent ${withdrawAmount} ${tokenSymbol} to ${receiver}`);
                console.log('Press Y to confirm, E to cancel');

                confirmWithdraw(mainApp, tx);
            }
        }
    });
}

export function confirmWithdraw(mainApp: MainApp, tx: any) {
    mainApp.getReadline().question(`Confirm?`, async (confirm) => {
        if (confirm === 'Y') {
            await submitTx(tx, mainApp.getLucid());
            console.log('Withdraw successfully');
            console.log('Press any key to continue');
            mainApp.getReadline().question(``, async () => {
                showWithdrawPage(mainApp);
            });
        } else if (confirm === 'E') {
            showWithdrawPage(mainApp);
        } else {
            console.log('Invalid answer');
            confirmWithdraw(mainApp, tx);
        }
    });
}