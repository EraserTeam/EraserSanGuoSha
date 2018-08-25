import ISkill from './ISkill';
interface ICreateSkill {
    name: ISkill['name'];
    tipName?: ISkill['tipName'];
    emperor?: ISkill['emperor'];
    type: ISkill['type'];
    enabled?: ISkill['enabled'];
    minCardCount?: ISkill['minCardCount'];
    maxCardCount?: ISkill['maxCardCount'];
    filterCard?: ISkill['filterCard'] | boolean;
    filterSelect?: ISkill['filterSelect'] | boolean;
    selectCorrectly?: ISkill['selectCorrectly'];
    cancel?: ISkill['cancel'];
    effect?: ISkill['effect'];
    viewAs?: ISkill['viewAs'];
    init?: ISkill['init'];
}
export default ICreateSkill;
