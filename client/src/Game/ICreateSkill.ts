interface ICreateSkill {
    name: ISkill['name'];
    tipName?: ISkill['tipName'];
    emperor?: ISkill['emperor'];
    type: ISkill['type'];
    enabled?: ISkill['enabled'];
    tip?: ISkill['tip'] | string;
    minCardCount?: ISkill['minCardCount'];
    maxCardCount?: ISkill['maxCardCount'];
    filterCard?: ISkill['filterCard'] | boolean;
    filterSelect?: ISkill['filterSelect'] | boolean;
    selectCorrectly?: ISkill['selectCorrectly'];
    showTargetLines?: ISkill['showTargetLines'];
    cancel?: ISkill['cancel'];
    viewAs?: ISkill['viewAs'];
    init?: ISkill['init'];
}