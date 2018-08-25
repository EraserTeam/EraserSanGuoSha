import ICardClass from './ICardClass';
interface ICreateCardClass {
    name: ICardClass['name'];
    tipName: ICardClass['tipName'];
    type: ICardClass['type'];
    delay?: ICardClass['delay'];
    rotate?: ICardClass['rotate'];
    equipType?: ICardClass['equipType'];
    attackRange?: ICardClass['attackRange'];
    enabled: ICardClass['enabled'] | boolean;
    filterSelect?: ICardClass['filterSelect'] | boolean;
    selectCorrectly?: ICardClass['selectCorrectly'];
    filterTarget?: ICardClass['filterTarget'];
    effect?: ICardClass['effect'];
    init?: ICardClass['init'];
}
export default ICreateCardClass;
