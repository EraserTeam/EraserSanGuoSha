class SelfGeneralArea extends eui.Component {
    private group_componentToSelect: eui.Group;
    private img_general: eui.Image;
    private img_backSideState: eui.Image;
    public img_seatNum: eui.Image;
    public img_dark: eui.Image;
    public img_selected: eui.Image;
    private img_country: eui.Image;
    private img_generalNameBG: eui.Image;
    public HPArea: SelfHPArea;
    private lb_generalName: eui.Label;
    private group_skills: eui.Group;
    private skillButtons: SkillButton[] = [];
    private btn_identity: IdentityButton;
    private img_helpMe: eui.Image;
    public constructor() {
        super();
        this.once(egret.Event.COMPLETE, this.onComplete, this);
    }
    private onComplete() {
        this.img_seatNum.source = '';
        this.lb_generalName.filters = [GlowFilter.generalNameGlow];
    }
    public set seatNum(num: number) {
        let source = `SelfSeat${num}_png`;
        this.img_seatNum.source = source;
    }
    public set alive(alive: boolean) {
        this.parent.filters = alive ? [] : [ColorFilter.gray];
    }
    public set country(country: Country) {
        this.img_country.source = `${Game.getCountryName(country).toUpperCase()}_png`;
        this.img_generalNameBG.source = `Self${Game.getCountryName(country)}BG`;
    }
    public set general(general: IGeneral) {
        this.img_general.source = `${general.name}_png`;
    }
    public set name(name: string) {
        this.lb_generalName.text = name;
    }
    public set skills(skills: Skill[]) {
        let left = false;
        let row = 0;
        let rowCount = Math.ceil(skills.length / 2);
        skills.every((skill, i) => {
            left = !left;
            left && row++;
            let onlyOne = left && i == skills.length - 1;
            let newOne = i >= this.skillButtons.length;
            if (newOne) {
                this.skillButtons.push(new SkillButton(skill));
            } else {
                this.skillButtons[i].skill = skill;
            }
            this.skillButtons[i].width = onlyOne ? 106 : 52;
            this.skillButtons[i].height = 20;
            this.skillButtons[i].bottom = 21 * (rowCount - row);
            if (left) {
                this.skillButtons[i].left = 0;
            } else {
                this.skillButtons[i].right = 0;
            }
            this.skillButtons[i].long = onlyOne;
            if (newOne) {
                this.group_skills.addChild(this.skillButtons[i]);
            }
            return true;
        });
        for (let i = skills.length; i < this.skillButtons.length;) {
            this.group_skills.removeChild(this.skillButtons[i]);
            this.skillButtons.splice(i, 1);
        }
    }
    public set identity(identity: Identity) {
        this.btn_identity.identity = identity;
    }
    public get componentToSelect() {
        return this.group_componentToSelect;
    }
    public set helpMe(bool: boolean) {
        this.img_helpMe.visible = bool;
    }
    public set back(bool: boolean) {
        this.img_backSideState.visible = bool;
    }
    public refreshSkillButtons() {
        this.skillButtons.forEach(button => {
            button.refreshStatus();
        });
    }
    public cancelSelectedSkill() {
        this.skillButtons.forEach(button => button.selected = false);
    }
    public playEffect(mc: egret.MovieClip) {
        mc.x = this.componentToSelect.x + this.componentToSelect.width / 2;
        mc.y = this.componentToSelect.y + this.componentToSelect.height / 2;
        this.addChild(mc);
        mc.gotoAndPlay(1, 1);
        mc.addEventListener(egret.Event.COMPLETE, () => this.removeChild(mc), this);
    }
}
