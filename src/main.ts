import * as readline from 'readline';
import {showMainMenuPage} from "./components/showMainMenuPage";
import {LucidEvolution} from "@lucid-evolution/lucid";
import {getLucidOgmiosInstance} from "./lucid-instance";
import {getPrivateKeyFrom} from "../hello-world/common";
import {PRIVATE_KEY_PATH} from "./common/types";
import {getAssets} from "./common/ultis";

export class MainApp {
    private readonly rl: readline.Interface;
    private privateKey: string | undefined;
    private readonly lucid: LucidEvolution;

    constructor(lucid: LucidEvolution) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.lucid = lucid;
    }

    public static async getInstance() {
        const lucid = await getLucidOgmiosInstance();
        return new MainApp(lucid);
    }

    public start() {
        console.log('Welcome to the app!');
        showMainMenuPage(this);
    }

    public getReadline() {
        return this.rl;
    }

    public getPrivateKey() {
        return getPrivateKeyFrom(PRIVATE_KEY_PATH);
    }

    public getLucid() {
        this.lucid.selectWallet.fromPrivateKey(this.getPrivateKey());
        return this.lucid;
    }

    public async getAddress() {
        return await this.getLucid().wallet().address();
    }
}

async function main() {
    const mainApp = await MainApp.getInstance();
    mainApp.start();
}

main();
