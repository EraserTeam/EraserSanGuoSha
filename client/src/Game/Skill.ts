class Skill implements ISkill {
    public data: ISkill;
    constructor(data: ISkill);
    constructor(data: string);
    constructor(data: ISkill | string) {
        if (typeof data == 'string')
            data = Game.getSkill(data);
        this.data = data;
    }
    public get package() {
        return this.data.package;
    }
    public get name() {
        return this.data.name;
    }
    public get tipName() {
        return this.data.tipName;
    }
    public get emperor() {
        return this.data.emperor;
    }
    public get type() {
        return this.data.type;
    }
    public get enabled() {
        return this.data.enabled;
    }
    public get tip() {
        return this.data.tip;
    }
    public get minCardCount() {
        return this.data.minCardCount;
    }
    public get maxCardCount() {
        return this.data.maxCardCount;
    }
    public get filterCard() {
        return this.data.filterCard;
    }
    public get filterSelect() {
        return this.data.filterSelect;
    }
    public get selectCorrectly() {
        return this.data.selectCorrectly;
    }
    public get showTargetLines() {
        return this.data.showTargetLines;
    }
    public get cancel() {
        return this.data.cancel;
    }
    public get viewAs() {
        return this.data.viewAs;
    }
    public get init() {
        return this.data.init;
    }
}