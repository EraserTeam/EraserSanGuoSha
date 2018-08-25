interface ISkill {
    package: Package;
    name: string;
    tipName?: string;
    emperor: boolean;
    type: SkillType;
    enabled: (player: Player) => boolean;
    tip: (skill: ISkill) => string;
    minCardCount: number;
    maxCardCount: number;
    filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]) => Card[];
    filterSelect: ((skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]) => Player[]) | false;
    selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) => boolean;
    cancel: boolean;
    showTargetLines: (player: Player, selected: Player[], show: (from: Player, to: Player, wait?: number) => void) => void;
    viewAs?(skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam?: any): Card;
    init?(room: Room): void;
}