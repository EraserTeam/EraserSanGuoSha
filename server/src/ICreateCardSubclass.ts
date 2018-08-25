import ICardClass from './ICardClass';
import ICreateCardClass from './ICreateCardClass';
interface ICreateCardSubclass {
    name: ICreateCardClass['name'];
    fullName: ICardClass['fullName'];
    tipFullName: ICardClass['tipFullName'];
    init?: ICreateCardClass['init'];
}
export default ICreateCardSubclass;
