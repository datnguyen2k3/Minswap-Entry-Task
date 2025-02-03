import {MainApp} from "../../main";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {showAddPairPage} from "./showAddPairPage";
import {showAddTokenPage} from "./showAddTokenPage";
import {showMainMenuPage} from "../showMainMenuPage";
import {showEnterPairPage} from "./exchange/showEnterPairPage";

const ENTER_TRADING_PAIR = '1';
const ADD_TRADING_PAIR = '2';
const REMOVE_TRADING_PAIR = '3';
const ADD_TOKEN = '4';
const REMOVE_TOKEN = '5';
const BACK = '6';

export function showTradingOptionsPage(mainApp: MainApp) {
    console.log();
    console.log('Market today:');


    console.log('Next option:');
    console.log('1 - Enter trading pair');
    console.log('2 - Add trading pair');
    console.log('3 - Remove trading pair');
    console.log('4 - Add token');
    console.log('5 - Remove token');
    console.log('6 - Back');
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