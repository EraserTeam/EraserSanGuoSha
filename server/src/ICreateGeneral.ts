import Country from './Country';
import Sex from './Sex';
interface ICreateGeneral {
    name: string;
    tipName: string;
    country: Country;
    sex: Sex;
    HP: number;
    skills: string[];
}
export default ICreateGeneral;
