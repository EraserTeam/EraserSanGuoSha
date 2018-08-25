class SkillButton extends eui.Button {
    private img_up: eui.Image;
    private img_down: eui.Image;
    private img_disabled: eui.Image;
    private _skill: Skill;
    private selectedBorder: egret.MovieClip;
    private selectedBorderShowing: boolean = false;
    private _selected: boolean = false;
    private _long: boolean = false;
    private selecting: boolean = false;
    public constructor(skill: Skill) {
        super();
        this.once(egret.Event.COMPLETE, () => {
            this.onComplete(skill);
        }, this);
        this.skinName = 'SkillButtonSkin';
    }
    private onComplete(skill: Skill) {
        this.skill = skill;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClick, this);
    }
    public get skill() {
        return this._skill;
    }
    public set skill(skill: Skill) {
        if (this._skill == skill)
            return;
        this._skill = skill;
        let skillTypeName;
        switch (skill.type) {
            case SkillType.Normal:
                skillTypeName = 'Normal';
                break;
            case SkillType.Lock:
                skillTypeName = 'Lock';
                break;
            case SkillType.Limit:
                skillTypeName = 'Limit';
                break;
            case SkillType.Awake:
                skillTypeName = 'Awake';
                break;
            default:
                throw new Error('unknown skillType');
        }
        this.img_up.source = `SkillButton_${skillTypeName}_Up_png`;
        this.img_down.source = `SkillButton_${skillTypeName}_Down_png`;
        this.img_disabled.source = `SkillButton_${skillTypeName}_Disabled_png`;
        this.label = skill.tipName || '';
        this.refreshFilter();
        this.refreshStatus();
    }
    public $setEnabled(value: boolean): boolean {
        let ret = super.$setEnabled(value);
        this.refreshFilter();
        return ret;
    }
    private refreshFilter() {
        let filter;
        if (!this.enabled) {
            filter = GlowFilter.disabledSkillFilter;
        } else {
            switch (this.skill.type) {
                case SkillType.Normal:
                    filter = GlowFilter.normalSkillFilter;
                    break;
                case SkillType.Lock:
                    filter = GlowFilter.lockSkillFilter;
                    break;
                case SkillType.Limit:
                    filter = GlowFilter.limitSkillFilter;
                    break;
                case SkillType.Awake:
                    filter = GlowFilter.awakeSkillFilter;
                    break;
                default:
                    throw new Error('unknown skillType');
            }
        }
        (this.labelDisplay as eui.Label).filters = [filter];
    }
    public refreshStatus() {
        this.enabled = this.skill.enabled(Game.room.selfPlayer) || this.selected || this.selecting;
        if (Game.room.askingMatch(AskingType.UseSkill, this.skill.name) && (this.skill.filterCard != Package.skillFilterCardDefault || this.skill.filterSelect))
            this.selected = true;
    }
    public onClick() {
        let player = Game.room.selfPlayer;
        let hasFilterSelect = false;
        if (this.skill.filterSelect) {
            hasFilterSelect = true;
        } else if (this.skill.viewAs) {
            if (player.room.askPlayers.includes(player) && player.room.askingType == AskingType.PlayCard) {
                hasFilterSelect = true;
            }
        }
        if (this.skill.filterCard == Package.skillFilterCardDefault && !hasFilterSelect) {
            if (this.selected) {
                Game.room.askingParam.btnStatus.cancel.onClick();
            } else {
                Game.room.selfPlayer.answer({
                    skill: this.skill.name,
                });
            }
        } else {
            if (Game.room.askingType == AskingType.UseSkill && Game.room.askingMatch(AskingType.UseSkill, this.skill.name)) {
                Game.room.askingParam.btnStatus.cancel.onClick();
            } else {
                if (!this.selected) {
                    this.selecting = true;
                    Game.room.selfPlayer.turnToUseSkill(this.skill.name);
                    this.selecting = false;
                    this.selected = true;
                } else {
                    Game.room.selfPlayer.turnToUseSkill();
                }
            }
        }
    }
    private initSelectedBorder() {
        let data = RES.getRes('SkillSelectedBorder_json');
        let txtr = RES.getRes('SkillSelectedBorder_png');
        let mcFactory = new egret.MovieClipDataFactory(data, txtr);
        this.selectedBorder = new egret.MovieClip(mcFactory.generateMovieClipData('SkillSelectedBorder'));
    }
    private showSelectedBorder() {
        if (this.selectedBorderShowing)
            return;
        if (!this.selectedBorder)
            this.initSelectedBorder();
        this.selectedBorderShowing = true;
        [this.selectedBorder.x, this.selectedBorder.y] = [-4, -3];
        this.addChild(this.selectedBorder);
        this.selectedBorder.gotoAndPlay('SkillSelectedBorder', -1);
    }
    private hideSelectedBorder() {
        if (!this.selectedBorderShowing)
            return;
        if (!this.selectedBorder)
            this.initSelectedBorder();
        this.selectedBorderShowing = false;
        this.selectedBorder.stop();
        this.removeChild(this.selectedBorder);
    }
    private refreshStyle() {
        this.selected ? this.showSelectedBorder() : this.hideSelectedBorder();
        if (this.selectedBorder)
            this.selectedBorder.scaleX = this.long ? 1.9 : 1;
    }
    public get selected() {
        return this._selected;
    }
    public set selected(bool: boolean) {
        this._selected = bool;
        this.refreshStyle();
    }
    public get long() {
        return this._long;
    }
    public set long(bool: boolean) {
        this._long = bool;
        this.refreshStyle();
    }
}