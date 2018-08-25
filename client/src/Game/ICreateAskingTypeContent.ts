interface ICreateAskingTypeContent {
    askingType: AskingType;
    tip?: string | IAskingTypeContent['tip'];
    minCardCount?: number | IAskingTypeContent['minCardCount'];
    maxCardCount?: number | IAskingTypeContent['maxCardCount'];
    filterCard?: IAskingTypeContent['filterCard'];
    filterSelect?: IAskingTypeContent['filterSelect'];
    selectCorrectly?: IAskingTypeContent['selectCorrectly'];
    btnStatus: IAskingTypeContent['btnStatus'];
}