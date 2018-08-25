interface ICardClass {
    package: Package;
    name: string;
    fullName: string;
    tipName: string;
    tipFullName: string;
    type: CardType;
    delay?: boolean;
    equipType: EquipType;
    attackRange: number;
    enabled: (card: Card, player: Player) => boolean;
    tip: (card: Card) => string;
    filterSelect: ((card: Card, player: Player, selected: Player[], targets: Player[]) => Player[]) | false;
    selectCorrectly: (card: Card, player: Player, selected: Player[]) => boolean;
    showTargetLines: (player: Player, selected: Player[], show: (from: Player, to: Player, wait?: number) => void) => void;
    init?(room: Room): void;
}