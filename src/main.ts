import * as readline from 'readline';
import {showMainMenuPage} from "./components/showMainMenuPage";
import {LucidEvolution} from "@lucid-evolution/lucid";
import {getPrivateKeyFrom} from "../hello-world/common";
import {PRIVATE_KEY_PATH} from "./common/types";
import {getAssets} from "./common/ultis";
import {getLucidOgmiosInstance} from "./providers/lucid-instance";
import "reflect-metadata"
import {DataSource} from "typeorm";
import {AppDataSource} from "./data-source";

export class MainApp {
    private readonly rl: readline.Interface;
    private privateKey: string | undefined;
    private readonly lucid: LucidEvolution;
    private readonly dataSource: DataSource;

    constructor(lucid: LucidEvolution, dataSource: DataSource) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.lucid = lucid;
        this.dataSource = dataSource;
    }

    public static async getInstance() {
        const lucid = await getLucidOgmiosInstance();
        const dataSource = AppDataSource;
        await dataSource.initialize();

        return new MainApp(lucid, dataSource);
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
