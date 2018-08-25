interface IOneButtonStatus {
    visible: () => boolean;
    enabled?: () => boolean;
    onClick?: () => void;
}
interface IButtonStatus {
    ok: IOneButtonStatus;
    cancel: IOneButtonStatus;
    over: IOneButtonStatus;
    heart?: IOneButtonStatus;
    diamond?: IOneButtonStatus;
    spade?: IOneButtonStatus;
    club?: IOneButtonStatus;
}
interface IAskingTypeContent {
    package: Package;
    tip: () => string;
    minCardCount: (player: Player) => number;
    maxCardCount: (player: Player) => number;
    filterCard: (player: Player, selectedCards: Card[], cards: Card[]) => Card[];
    filterSelect: (cards: Card[], player: Player, selected: Player[], targets: Player[]) => Player[] | false;
    selectCorrectly: (cards: Card[], player: Player, selected: Player[]) => boolean;
    btnStatus: IButtonStatus;
}