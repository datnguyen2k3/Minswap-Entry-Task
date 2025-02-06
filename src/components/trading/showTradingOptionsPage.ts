import {MainApp} from "../../main";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {showAddPairPage} from "./showAddPairPage";
import {showAddTokenPage} from "./showAddTokenPage";
import {showMainMenuPage} from "../showMainMenuPage";
import {showEnterPairPage} from "./exchange/showEnterPairPage";
import {getTradeTokens, getTokenTotalPage} from "../../repository/token-repository";
import {getPrice} from "../../common/ultis";

const ENTER_TRADING_PAIR = '1';
const ADD_TRADING_PAIR = '2';
const REMOVE_TRADING_PAIR = '3';
const ADD_TOKEN = '4';
const REMOVE_TOKEN = '5';
const NEXT_PAGE = '6';
const PREVIOUS_PAGE = '7';
const BACK = '8';

const PER_PAGE = 10;

export async function showTradingOptionsPage(mainApp: MainApp, page: number = 0) {
    console.log();
    console.log('Market today:');
    const tokens = await getTradeTokens(mainApp.getDataSource(), 0, 10);
    for (let i = 0; i < tokens.length; i++) {
        const orderIndex = i + 1 + page * PER_PAGE;
        const symbol = tokens[i].tradeName;
        if (!symbol) {
            throw new Error('Token symbol not found');
        }

        const price = await getPrice(mainApp, symbol, 'ADA');
        console.log(`${orderIndex}. ${symbol}: ${price} ADA`);
    }
    const totalPage = await getTokenTotalPage(mainApp.getDataSource(), PER_PAGE);
    console.log(`Page ${page + 1}/${totalPage}`);
    console.log();

    console.log('Next option:');
    console.log('1 - Enter pair to trading');
    console.log('2 - Add trading pair');
    console.log('3 - Remove trading pair');
    console.log('4 - Add token');
    console.log('5 - Remove token');
    console.log('6 - Go to next page');
    console.log('7 - Go to previous page');
    console.log('8 - Back');
    mainApp.getReadline().question('Enter your choice:', (answer: string) => {
        switch (answer) {
            case ENTER_TRADING_PAIR:
                showEnterPairPage(mainApp);
                break;
            case ADD_TRADING_PAIR:
                showAddPairPage(mainApp);
                break;
            case REMOVE_TRADING_PAIR:
                console.log('Remove trading pair');
                break;
            case ADD_TOKEN:
                showAddTokenPage(mainApp);
                break;
            case REMOVE_TOKEN:
                console.log('Remove token');
                break;
            case NEXT_PAGE:
                showTradingOptionsPage(mainApp, page + 1);
                break;
            case PREVIOUS_PAGE:
                showTradingOptionsPage(mainApp, page - 1);
                break;
            case BACK:
                showMainMenuPage(mainApp);
                break;
            default:
                showInvalidAnswer();
                showTradingOptionsPage(mainApp);
                break;
        }
    });

}