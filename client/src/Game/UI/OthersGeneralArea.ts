class OthersGeneralArea extends eui.Component {
    private group_componentToSelect: eui.Group;
    private img_general: eui.Image;
    private img_backSideState: eui.Image;
    public img_phase: eui.Image;
    public img_seatNum: eui.Image;
    public img_dark: eui.Image;
    public img_selected: eui.Image;
    private img_country: eui.Image;
    private img_generalNameBG: eui.Image;
    private equipUI0: OthersEquip;
    private equipUI1: OthersEquip;
    private equipUI2: OthersEquip;
    private equipUI3: OthersEquip;
    public HPArea: OthersHPArea;
    public cardCountLabel: CardCountLabel;
    public judgeZoneUI: JudgeZoneFlag[] = [];
    private lb_generalName: eui.Label;
    private btn_identity: IdentityButton;
    private img_helpMe: eui.Image;
    private _identity: Identity;
    private img_deadFlag: eui.Image;
    public constructor() {
        super();
        this.once(egret.Event.COMPLETE, this.onComplete, this);
    }
    private onComplete() {
        this.img_phase.source = '';
        this.img_seatNum.source = '';
        this.lb_generalName.filters = [GlowFilter.generalNameGlow];
    }
    public get equipUI() {
        return [this.equipUI0, this.equipUI1, this.equipUI2, this.equipUI3];
    }
    public set country(country: Country) {
        this.cardCountLabel.country = country;
        this.img_country.source = `${Game.getCountryName(country).toUpperCase()}_png`;
        this.img_generalNameBG.source = `${Game.getCountryName(country)}BG`;
    }
    public set seatNum(num: number) {
        let source = `Seat${num}_png`;
        this.img_seatNum.source = source;
    }
    public set identity(identity: Identity) {
        this._identity = identity;
        this.btn_identity.identity = identity;
    }
    public set alive(alive: boolean) {
        this.img_general.filters = alive ? [] : [ColorFilter.gray];
        if (alive) {
            this.img_deadFlag.visible = false;
        } else {
            let source = `${Game.getIdentityName(this._identity)}Dead_png`;
            if (!RES.hasRes(source))
                source = '';
            this.img_deadFlag.source = source;
            this.img_deadFlag.visible = true;
        }
    }
    public set general(general: IGeneral) {
        this.img_general.source = `${general.name}_png`;
    }
    public set name(name: string) {
        this.lb_generalName.text = name;
    }
    public get componentToSelect() {
        return this;
    }
    public set helpMe(bool: boolean) {
        this.img_helpMe.visible = bool;
    }
    public set back(bool: boolean) {
        this.img_backSideState.visible = bool;
    }
    private static getJudgeZoneCardPicName(cardClass: string) {
        return `Small${cardClass}_png`;
    }
    public addToJudgeZoneUI(cardClass: string) {
        let flag = new JudgeZoneFlag();
        flag.width = 25;
        flag.height = 25;
        flag.right = 108;
        flag.y = 114;
        flag.source = OthersGeneralArea.getJudgeZoneCardPicName(cardClass);
        this.addChild(flag);
        this.judgeZoneUI.push(flag);
        this.refreshJudgeZoneUI();
    }
    public removeFromJudgeZoneUI(cardClass: string) {
        let picName = OthersGeneralArea.getJudgeZoneCardPicName(cardClass);
        for (let i = 0; i < this.judgeZoneUI.length; i++) {
            if (this.judgeZoneUI[i].source == picName) {
                this.removeChild(this.judgeZoneUI[i]);
                this.judgeZoneUI.splice(i, 1);
                i--;
            }
        }
        this.refreshJudgeZoneUI();
    }
    public refreshJudgeZoneUI() {
        let cnt = this.judgeZoneUI.length;
        let offset = 2;
        this.judgeZoneUI.every((flag, index) => {
            let toRight = 13 + index * (flag.width + offset);
            if (!flag.toRight || flag.toRight != toRight) {
                flag.toRight = toRight;
                egret.Tween.removeTweens(flag);
                egret.Tween.get(flag).to({ right: toRight }, 300);
            }
            return true;
        });
    }
    public playEffect(mc: egret.MovieClip) {
        mc.x = this.width / 2;
        mc.y = this.height / 2;
        this.addChild(mc);
        mc.gotoAndPlay(1, 1);
        mc.addEventListener(egret.Event.COMPLETE, () => this.removeChild(mc), this);
    }
}
