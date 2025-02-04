import * as readline from 'readline';
import {showMainMenuPage} from "./components/showMainMenuPage";
import {LucidEvolution} from "@lucid-evolution/lucid";
import {getKeyFrom} from "../hello-world/common";
import {ADMIN_PUBLIC_KEY_HASH_PATH, PASSWORD_PATH, PRIVATE_KEY_PATH} from "./common/types";
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
        return getKeyFrom(PRIVATE_KEY_PATH);
    }

    public getLucid() {
        this.lucid.selectWallet.fromPrivateKey(this.getPrivateKey());
        return this.lucid;
    }

    public async getAddress() {
        return await this.getLucid().wallet().address();
    }

    public getAdminPublicKeyHash() {
        return getKeyFrom(ADMIN_PUBLIC_KEY_HASH_PATH);
    }

    public getDataSource() {
        return this.dataSource;
    }

    public getEncryptedPassword() {
        return getKeyFrom(PASSWORD_PATH);
    }
}

async function main() {
    const mainApp = await MainApp.getInstance();
    mainApp.start();
}

main();
