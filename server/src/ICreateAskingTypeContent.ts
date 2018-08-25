import AskingType from './AskingType';
import IAskingTypeContent from './IAskingTypeContent';
interface ICreateAskingTypeContent {
    askingType: AskingType;
    minCardCount?: number | IAskingTypeContent['minCardCount'];
    maxCardCount?: number | IAskingTypeContent['maxCardCount'];
    filterCard?: IAskingTypeContent['filterCard'];
    filterSelect?: IAskingTypeContent['filterSelect'];
    selectCorrectly?: IAskingTypeContent['selectCorrectly'];
}
export default ICreateAskingTypeContent;
