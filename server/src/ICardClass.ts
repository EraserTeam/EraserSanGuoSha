import Card from './Card';
import CardType from './CardType';
import EquipType from './EquipType';
import Package from './Package';
import Player from './Player';
import Room from './Room';
interface ICardClass {
    package: Package;
    name: string;
    fullName: string;
    tipName: string;
    tipFullName: string;
    type: CardType;
    delay?: boolean;
    rotate?: boolean;
    equipType: EquipType;
    attackRange: number;
    enabled: (card: Card, player: Player) => boolean;
    filterSelect: ((card: Card, player: Player, selected: Player[], targets: Player[]) => Player[]) | false;
    selectCorrectly: (card: Card, player: Player, selected: Player[]) => boolean;
    filterTarget: (card: Card, player: Player, targets: Player[]) => Player[];
    effect?(card: Card, source: Player | undefined, selected: Player[], targets: Player[], target?: Player): Promise<boolean | void>;
    init?(room: Room): void;
}
export default ICardClass;
