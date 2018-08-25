class SelfEquip extends eui.Component {
    private img_equip: eui.Image;
    private img_suit: eui.Image;
    private img_number: eui.Image;
    private selectedBorder: egret.MovieClip;
    private selectedBorderShowing: boolean = false;
    private _canSelect: boolean = false;
    private _selected: boolean = false;
    private mouseover: boolean = false;
    private callback_unselected: () => void;
    private callback_selected: () => void;
    public constructor() {
        super();
        this.init();
    }
    private init() {
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddedToStage, this);
        this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemovedFromStage, this);
        this.skinName = 'SelfEquipSkin';
    }
    public set equip(equip: Card) {
        let color = Game.getColorName(Game.getColor(equip.suit));
        this.img_equip.source = `Self${equip.class.name}_png`;
        this.img_suit.source = Game.getSuitName(equip.suit).toLowerCase();
        this.img_number.source = `${color}CardNumber_${equip.number}`;
    }
    private onAddedToStage() {
        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.startMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.releaseOutside, this);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClick, this);
    }
    private startMove(e: egret.TouchEvent): void {
        this.mouseover = true;
        this.refreshStyle();
    }
    private releaseOutside(e: egret.TouchEvent) {
        this.mouseover = false;
        this.refreshStyle();
    }
    private onRemovedFromStage() {
        this.touchEnabled = false;
        this.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.startMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.releaseOutside, this);
        this.stage.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onClick, this);
    }
    private initSelectedBorder() {
        let data = RES.getRes('EquipSelectedBorder_json');
        let txtr = RES.getRes('EquipSelectedBorder_png');
        let mcFactory = new egret.MovieClipDataFactory(data, txtr);
        this.selectedBorder = new egret.MovieClip(mcFactory.generateMovieClipData('EquipSelectedBorder'));
    }
    private showSelectedBorder() {
        if (this.selectedBorderShowing)
            return;
        if (!this.selectedBorder)
            this.initSelectedBorder();
        this.selectedBorderShowing = true;
        [this.selectedBorder.x, this.selectedBorder.y] = [-3, -2];
        this.addChild(this.selectedBorder);
        this.selectedBorder.gotoAndPlay('EquipSelectedBorder', -1);
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
    public get canSelect() {
        return this._canSelect;
    }
    public set canSelect(bool: boolean) {
        this._canSelect = bool;
        if (!bool && this.selected)
            this.selected = false;
        else
            this.refreshStyle();
        if (!bool)
            [this.callback_unselected, this.callback_unselected] = [undefined, undefined];
    }
    public get selected() {
        return this._selected;
    }
    public set selected(bool: boolean) {
        this._selected = bool;
        this.refreshStyle();
    }
    private refreshStyle() {
        let x = 7;
        this.canSelect && (x += 10) && this.selected && (x += 10);
        if (x != this.x) {
            egret.Tween.removeTweens(this);
            egret.Tween.get(this).to({ x }, 100);
        }
        this.img_equip.filters = this.canSelect && this.mouseover || this.selected ? [GlowFilter.mouseover] : [];
        this.selected ? this.showSelectedBorder() : this.hideSelectedBorder();
    }
    private onClick() {
        this.mouseover = false;
        if (this.canSelect) {
            this.selected = !this.selected;
            if (this.selected) {
                if (typeof this.callback_selected != 'undefined') {
                    this.callback_selected();
                }
            } else
                if (typeof this.callback_unselected != 'undefined') {
                    this.callback_unselected();
                }
        }
    }
    public setCallback({ unselected, selected }: { unselected?: () => void, selected: () => void }) {
        if (!unselected)
            unselected = () => Game.room.selfPlayer.turnToUseSkill('');
        [this.callback_unselected, this.callback_selected] = [unselected, selected];
        this.canSelect = true;
        this.selected = false;
    }
    public onSelectCallOk() {
        this.setCallback({
            selected: () => Game.room.askingParam.btnStatus.ok.onClick(),
        });
    }
}