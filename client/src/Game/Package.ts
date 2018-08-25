class Package {
    public static card: any = {};
    public static general: any = {};
    public static modes: any = {};
    public static init() {
        for (let k of Object.keys(Package.card)) {
            Package.card[k]();
        }
        for (let k of Object.keys(Package.general)) {
            Package.general[k]();
        }
        for (let k of Object.keys(Package.modes)) {
            Package.modes[k]();
        }
    }
    public name: string;
    public cardClasses: any = {};
    public skills: any = {};
    public generals: any = {};
    public askingTypeContents: any = {};
    public askings: any = {};
    constructor(name: string) {
        this.name = name;
    }
    public getCardClass(card: ICardInfo): ICardClass {
        return this.cardClasses[card.class] || { package: this, type: 0, enabled: false };
    }
    public createCardClass(createCardClass: ICreateCardClass) {
        let cardClass = this.initCardClass(createCardClass);
        Game.cardClasses[cardClass.name] = this.cardClasses[cardClass.name] = cardClass;
    }
    private static cardClassEnabledFalse = () => false;
    private static cardClassEnabledTrue = () => true;
    private static cardClassFilterSelectTrue = (card: Card, player: Player, selected: Player[], targets: Player[]) => targets;
    private static cardClassSelectCorrectlyDefault = () => true;
    private static cardClassFilterTargetDefault = (card: Card, player: Player, targets: Player[]) => targets;
    private static cardClassShowTatgetLinesDefault = (player: Player, selected: Player[], show: (from: Player, to: Player, wait?: number) => void) => selected.forEach(e => show(player, e));
    private initCardClass(createCardClass: ICreateCardClass): ICardClass {
        if (Game.cardClasses[createCardClass.name])
            throw new Error(`CardClass "${createCardClass.name}" already exists.`);
        if (createCardClass.type == CardType.Equip) {
            if (typeof createCardClass.equipType == 'undefined')
                throw new Error('missing equipType');
            if (createCardClass.equipType == EquipType.Arm) {
                if (typeof createCardClass.attackRange == 'undefined')
                    throw new Error('missing attackRange');
            }
        }
        if (createCardClass.enabled === false)
            createCardClass.enabled = Package.cardClassEnabledFalse;
        else if (createCardClass.enabled === true)
            createCardClass.enabled = Package.cardClassEnabledTrue;
        if (typeof createCardClass.tip != 'function') {
            let tip = createCardClass.tip || '';
            createCardClass.tip = () => tip;
        }
        if (!createCardClass.filterSelect)
            createCardClass.filterSelect = false;
        else if (createCardClass.filterSelect === true)
            createCardClass.filterSelect = Package.cardClassFilterSelectTrue;
        if (!createCardClass.selectCorrectly)
            createCardClass.selectCorrectly = Package.cardClassSelectCorrectlyDefault;
        if (!createCardClass.showTargetLines)
            createCardClass.showTargetLines = Package.cardClassShowTatgetLinesDefault;
        let cardClass = createCardClass as ICardClass;
        cardClass.package = this;
        cardClass.fullName = cardClass.name;
        cardClass.tipFullName = cardClass.tipName;
        return cardClass;
    }
    public createCardSubclass(createCardSubclass: ICreateCardSubclass) {
        let cardClass = this.initCardSubclass(createCardSubclass);
        Game.cardClasses[cardClass.name] = this.cardClasses[cardClass.name] = cardClass;
    }
    private initCardSubclass(createCardSubclass: ICreateCardSubclass): ICardClass {
        if (Game.cardClasses[createCardSubclass.fullName])
            throw new Error(`CardClass "${createCardSubclass.fullName}" already exists.`);
        let superclass: ICardClass = Game.cardClasses[createCardSubclass.name];
        return {
            package: this,
            name: createCardSubclass.name,
            fullName: createCardSubclass.fullName,
            tipName: superclass.tipName,
            tipFullName: createCardSubclass.tipFullName,
            type: superclass.type,
            delay: superclass.delay,
            equipType: superclass.equipType,
            attackRange: superclass.attackRange,
            enabled: superclass.enabled,
            tip: superclass.tip,
            filterSelect: superclass.filterSelect,
            selectCorrectly: superclass.selectCorrectly,
            showTargetLines: superclass.showTargetLines,
            init: superclass.init,
        };
    }
    public getSkill(skillName: string): ISkill {
        return this.skills[skillName];
    }
    public createSkill(createSkill: ICreateSkill) {
        let skill = this.initSkill(createSkill);
        Game.skills[skill.name] = this.skills[skill.name] = skill;
    }
    private static skillEnabledDefault = () => false;
    public static skillFilterCardDefault = () => [];
    private static skillFilterCardTrue = (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]) => cards;
    private static skillFilterSelectTrue = (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]) => targets;
    private static skillSelectCorrectlyTrue = () => true;
    private static skillShowTatgetLinesDefault = (player: Player, selected: Player[], show: (from: Player, to: Player, wait?: number) => void) => selected.forEach(e => show(player, e));
    private initSkill(createSkill: ICreateSkill): ISkill {
        if (Game.skills[createSkill.name])
            throw new Error(`Skill "${createSkill.name}" already exists.`);
        if (!createSkill.enabled)
            createSkill.enabled = Package.skillEnabledDefault;
        if (typeof createSkill.tip != 'function') {
            let tip = createSkill.tip || '';
            createSkill.tip = () => tip;
        }
        if (typeof createSkill.maxCardCount == 'undefined')
            createSkill.maxCardCount = 0;
        if (typeof createSkill.minCardCount == 'undefined')
            createSkill.minCardCount = createSkill.maxCardCount ? 1 : 0;
        if (!createSkill.filterCard)
            createSkill.filterCard = Package.skillFilterCardDefault;
        else if (createSkill.filterCard === true)
            createSkill.filterCard = Package.skillFilterCardTrue;
        if (!createSkill.filterSelect)
            createSkill.filterSelect = false;
        else if (createSkill.filterSelect === true)
            createSkill.filterSelect = Package.skillFilterSelectTrue;
        if (!createSkill.selectCorrectly)
            createSkill.selectCorrectly = Package.skillSelectCorrectlyTrue;
        if (typeof createSkill.cancel == 'undefined')
            createSkill.cancel = true;
        if (!createSkill.showTargetLines)
            createSkill.showTargetLines = Package.skillShowTatgetLinesDefault;
        let skill = createSkill as ISkill;
        skill.package = this;
        return skill;
    }
    public getGeneral(name: string): IGeneral {
        return this.generals[name];
    }
    public createGeneral(createGeneral: ICreateGeneral) {
        if (Game.generals[createGeneral.name])
            throw new Error(`General "${createGeneral.name}" already exists.`);
        let general = createGeneral as IGeneral;
        general.package = this;
        Game.generals[general.name] = this.generals[general.name] = general;
    }
    public createAskingTypeContent(createAskingTypeContent: ICreateAskingTypeContent) {
        let askingType = createAskingTypeContent.askingType;
        let askingTypeContent = this.initAskingTypeContent(createAskingTypeContent);
        askingTypeContent.package = this;
        Game.askingTypeContents[askingType] = this.askingTypeContents[askingType] = askingTypeContent;
    }
    private static askingTypeContentFilterCardDefault = () => [];
    private static askingTypeContentFilterSelectDefault: () => false = () => false;
    private static askingTypeContentSelectCorrectlyDefault = () => true;
    private static askingTypeContentViewAsDefault = () => undefined;
    private initAskingTypeContent(createAskingTypeContent: ICreateAskingTypeContent): IAskingTypeContent {
        if (Game.askingTypeContents[createAskingTypeContent.askingType])
            throw new Error(`AskingTypeContents "${AskingType[createAskingTypeContent.askingType]}" already exists.`);
        if (typeof createAskingTypeContent.tip != 'function') {
            const tip = createAskingTypeContent.tip || '';
            createAskingTypeContent.tip = () => tip;
        }
        if (typeof createAskingTypeContent.maxCardCount == 'undefined')
            createAskingTypeContent.maxCardCount = 0;
        if (typeof createAskingTypeContent.maxCardCount == 'number') {
            const n = createAskingTypeContent.maxCardCount;
            createAskingTypeContent.maxCardCount = () => n;
        }
        if (typeof createAskingTypeContent.minCardCount == 'undefined') {
            createAskingTypeContent.minCardCount = (player: Player) => (createAskingTypeContent as any).maxCardCount(player) ? 1 : 0;
        } else if (typeof createAskingTypeContent.minCardCount == 'number') {
            const n = createAskingTypeContent.minCardCount;
            createAskingTypeContent.minCardCount = () => n;
        }
        if (!createAskingTypeContent.filterCard)
            createAskingTypeContent.filterCard = Package.askingTypeContentFilterCardDefault;
        if (!createAskingTypeContent.filterSelect)
            createAskingTypeContent.filterSelect = Package.askingTypeContentFilterSelectDefault;
        if (!createAskingTypeContent.selectCorrectly)
            createAskingTypeContent.selectCorrectly = Package.askingTypeContentSelectCorrectlyDefault;
        ['heart', 'diamond', 'spade', 'club'].forEach(suit => {
            createAskingTypeContent.btnStatus[suit] = createAskingTypeContent.btnStatus[suit] || {
                visible: () => false,
            };
        });
        let askingTypeContent = createAskingTypeContent as any;
        askingTypeContent.package = this;
        delete askingTypeContent.askingType;
        return askingTypeContent;
    }
    public getAsking(name: string): IAsking {
        return this.askings[name];
    }
    public createAsking(createAsking: ICreateAsking) {
        if (Game.askings[createAsking.name])
            throw new Error(`Asking "${createAsking.name}" already exists.`);
        let asking = createAsking as IAsking;
        asking.package = this;
        Game.askings[asking.name] = this.askings[asking.name] = asking;
    }
}