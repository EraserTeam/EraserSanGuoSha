import Card from './Card';
import Package from './Package';
import Player from './Player';
interface IAskingTypeContent {
    package: Package;
    minCardCount: (player: Player) => number;
    maxCardCount: (player: Player) => number;
    filterCard: (player: Player, selectedCards: Card[], cards: Card[]) => Card[];
    filterSelect: (
        /**
         * @param cards 选中的卡牌
         * @param card 视为的卡牌
         * @return 若为false，则无需选择
         */
        (cards: Card[], player: Player, selected: Player[], targets: Player[]) => Player[] | false
    );
    selectCorrectly: (cards: Card[], player: Player, selected: Player[]) => boolean;
}
export default IAskingTypeContent;
