class CardRenderer extends eui.ItemRenderer {
    public group: eui.Group;
    public img_class: eui.Image;
    public img_dark: eui.Image;
    public tw_moving: egret.Tween;
    public tw_disappearing: egret.Tween;
    public toPoint: { x: number, y: number };
    public fixed: boolean = false;
    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddedToStage, this);
        this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemovedFromStage, this);
        this.skinName = 'CardRendererSkin';
    }
    public get dark() {
        return this.img_dark.alpha;
    }
    public set dark(alpha: number) {
        this.img_dark.alpha = alpha;
    }
    protected dataChanged() {
        this.enabled = !this.data.disabled;
        if (!this.enabled)
            this.img_class.filters = [];
    }
    private onAddedToStage() {
        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.startMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.stopMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.releaseOutside, this);
    }
    private startMove(e: egret.TouchEvent): void {
        this.img_class.filters = this.enabled ? [GlowFilter.mouseover] : [];
    }
    private stopMove(e: egret.TouchEvent): void {
        let selected = !this.selected;
        this.refreshStyle(selected);
    }
    private releaseOutside(e: egret.TouchEvent): void {
        this.refreshStyle();
    }
    private onRemovedFromStage() {
        this.touchEnabled = false;
        this.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.startMove, this);
        this.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.stopMove, this);
        this.removeEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.releaseOutside, this);
    }
    public refreshStyle(selected?: boolean) {
        if (typeof selected == 'undefined')
            selected = this.selected;
        this.img_class.filters = this.enabled && selected ? [GlowFilter.mouseover] : [];
        if (this.fixed)
            return;
        let y = selected ? -10 : 0;
        egret.Tween.removeTweens(this.group);
        egret.Tween.get(this.group).to({ y }, 100);
    }
}
class FixedCardRenderer extends CardRenderer {
    public constructor() {
        super();
        this.fixed = true;
    }
}
class CardRendererWithBack extends egret.DisplayObjectContainer {
    public tw_moving: egret.Tween;
    public tw_disappearing: egret.Tween;
    public toPoint: { x: number, y: number };
    public front: CardRenderer;
    public back: CardRenderer;
    public rotate = true;
    public constructor(data) {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, () => {
            this.touchChildren = true;
            this.front = new CardRenderer();
            this.front.data = data;
            this.addChild(this.front);
            this.back = new CardRenderer();
            this.back.data = Game.makeCardUIData(Game.room.unknownCard);
            this.addChild(this.back);
            this.width = this.front.width;
            this.height = this.front.height;
        }, this);

    }
    public get data() {
        return this.front.data;
    }
    public get img_dark() {
        return this.front.img_dark;
    }
    public get frontScaleX() {
        return this.front.scaleX;
    }
    public set frontScaleX(scaleX: number) {
        this.front.scaleX = scaleX;
    }
    public get frontSbackScaleXcaleX() {
        return this.back.scaleX;
    }
    public set backScaleX(scaleX: number) {
        this.back.scaleX = scaleX;
    }
    public get dark() {
        return this.img_dark.alpha;
    }
    public set dark(alpha: number) {
        this.img_dark.alpha = alpha;
    }
}
type CardUI = CardRenderer | CardRendererWithBack;