import ICreateGeneral from './ICreateGeneral';
import Package from './Package';
interface IGeneral extends ICreateGeneral {
    package: Package;
}
export default IGeneral;
