class DrogComponent extends eui.Component {
    private offsetX: number;
    private offsetY: number;
    protected enableDrog: boolean = true;
    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddedToStage, this);
        this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemovedFromStage, this);
    }
    private onAddedToStage() {
        this.touchEnabled = true;
        this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.startMove, this);
        this.stage.addEventListener(egret.TouchEvent.TOUCH_END, this.stopMove, this);
    }
    private startMove(e: egret.TouchEvent): void {
        if (!this.enableDrog) return;
        this.offsetX = e.stageX - this.x;
        this.offsetY = e.stageY - this.y;
        this.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onMove, this);
    }
    private stopMove(e: egret.TouchEvent) {
        this.stage.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.onMove, this);
    }
    private onMove(e: egret.TouchEvent): void {
        this.x = e.stageX - this.offsetX;
        this.y = e.stageY - this.offsetY;
    }
    private onRemovedFromStage() {
        this.touchEnabled = false;
        this.stage.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.startMove, this);
        this.stage.removeEventListener(egret.TouchEvent.TOUCH_END, this.stopMove, this);
        this.stage.removeEventListener(egret.TouchEvent.TOUCH_END, this.onMove, this);
    }
}