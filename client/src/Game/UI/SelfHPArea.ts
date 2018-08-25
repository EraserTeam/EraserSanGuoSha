class SelfHPArea extends eui.Component {
    public group_HP: eui.Group;
    private _maxHP: number;
    private _HP: number;
    //1为绿色 2为橙色 3为红色
    private HPColor = [
        [1], //1血
        [3, 1], //2血
        [3, 2, 1], //3血
        [3, 2, 1, 1], //4血
        [3, 2, 2, 1, 1], //5血
    ];
    public constructor() {
        super();
    }
    public get maxHP(): number {
        return this._maxHP;
    }
    public set maxHP(maxHP: number) {
        this._maxHP = maxHP;
        this.refresh();
    }
    public get HP(): number {
        return this._HP;
    }
    public set HP(HP: number) {
        this._HP = HP;
        this.refresh();
    }
    private get HPComponents(): eui.Image[] {
        if (!this.group_HP) return null;
        let arr: eui.Image[] = [];
        for (let i = 0; i < 5; i++) {
            arr.push(this.group_HP.getChildAt(i) as eui.Image);
        }
        return arr;
    }
    private refresh() {
        let HPComponents = this.HPComponents;
        if (!HPComponents) return;
        let colors = this.maxHP > 0 ? this.HPColor[this.maxHP - 1] : null;
        let color = (colors && this.HP > 0) ? colors[this.HP - 1] : 0;
        let source = '';
        if (color == 1) {
            source = 'GreenHPBig';
        } else if (color == 2) {
            source = 'OrangeHPBig';
        } else if (color == 3) {
            source = 'RedHPBig';
        }
        HPComponents.every((element, i): boolean => {
            let hp = i + 1;
            if (this.maxHP < hp) {
                element.visible = false;
                return true;
            } else {
                element.visible = true;
            }
            let exist: boolean = hp <= this.HP;
            if (exist) {
                element.source = source;
            } else {
                element.source = 'BlackHPBig';
            }
            element.bottom = 3 + i * 17;
            return true;
        });
    }
    public playLoseHPEffect(originalHP: number, HP: number, mcArr: egret.MovieClip[]) {
        for (let i = HP; i < originalHP; i++) {
            let mc = mcArr.splice(0, 1)[0];
            mc.x = this.width / 2;
            mc.y = this.height - 3 - i * 17;
            this.addChild(mc);
            mc.gotoAndPlay(1, 1);
            mc.addEventListener(egret.Event.COMPLETE, () => this.removeChild(mc), this);
        }
    }
}