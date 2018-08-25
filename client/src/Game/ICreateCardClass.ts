interface ICreateCardClass {
    name: ICardClass['name'];
    tipName: ICardClass['tipName'];
    type: ICardClass['type'];
    delay?: ICardClass['delay'];
    equipType?: ICardClass['equipType'];
    attackRange?: ICardClass['attackRange'];
    enabled: ICardClass['enabled'] | boolean;
    tip?: ICardClass['tip'] | string;
    filterSelect?: ICardClass['filterSelect'] | boolean;
    selectCorrectly?: ICardClass['selectCorrectly'];
    showTargetLines?: ICardClass['showTargetLines'];
    init?: ICardClass['init'];
}