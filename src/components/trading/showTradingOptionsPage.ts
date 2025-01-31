import {MainApp} from "../../main";
import {showInvalidAnswer} from "../showInvalidAnswer";
import {showAddPairPage} from "./showAddPairPage";

const ENTER_TRADING_PAIR = '1';
const ADD_TRADING_PAIR = '2';
const REMOVE_TRADING_PAIR = '3';
const BACK = '4';

export function showTradingOptionsPage(mainApp: MainApp) {
    console.log('Market today:');


    console.log('Next option:');
    console.log('1 - Enter trading pair');
    console.log('2 - Add trading pair');
    console.log('3 - Remove trading pair');
    console.log('4 - Back');
    mainApp.getReadline().question('Enter your choice:', (answer: string) => {
        switch (answer) {
            case ENTER_TRADING_PAIR:
                console.log('Enter trading pair');
                break;
            case ADD_TRADING_PAIR:
                showAddPairPage(mainApp);
                break;
            case REMOVE_TRADING_PAIR:
                console.log('Remove trading pair');
                break;
            case BACK:
                console.log('Back');
                break;
            default:
                showInvalidAnswer();
                showTradingOptionsPage(mainApp);
                break;
        }
    });

}