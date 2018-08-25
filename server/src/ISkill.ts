import Card from './Card';
import Package from './Package';
import Player from './Player';
import Room from './Room';
import SkillType from './SkillType';
interface ISkill {
    package: Package;
    name: string;
    tipName?: string;
    emperor: boolean;
    type: SkillType;
    enabled: (player: Player) => boolean;
    minCardCount: number;
    maxCardCount: number;
    filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]) => Card[];
    filterSelect: (
        /**
         * @param targets 不包含selected
         * @return 为false则不需要选择
         */
        (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]) => Player[]
    ) | false;
    //若为undefined 则无论如何选择 都为true
    selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) => boolean;
    cancel: boolean;
    effect?(skill: ISkill, player: Player, skillParam?: any): Promise<any>;
    viewAs?(skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam?: any): Card;
    init?(room: Room): void;
}
export default ISkill;
