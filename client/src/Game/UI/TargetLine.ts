class TargetLine extends eui.Group {
    private img_line: eui.Image;
    public constructor() {
        super();
        this.init();
    }
    private init() {
        this.img_line = new eui.Image();
        this.img_line.source = 'TargetLine_png';
        this.img_line.left = 0;
        this.img_line.right = 0;
        this.addChild(this.img_line);
    }
    private static tw: egret.Tween;
    public static show(from: BigArea, to: BigArea) {
        let line = new TargetLine();
        let fromPoint = {
            x: from.x + from.width / 2,
            y: from.y + from.height / 2,
        };
        let toPoint = {
            x: to.x + to.width / 2,
            y: to.y + to.height / 2,
        };
        line.x = fromPoint.x;
        line.y = fromPoint.y;
        let deltaX = toPoint.x - fromPoint.x;
        let deltaY = toPoint.y - fromPoint.y;
        let radian = Math.atan2(deltaY, deltaX);
        let angle = radian * 180 / Math.PI;
        line.rotation = angle;
        line.width = 0;
        let toWidth = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        UI.sceneGame.addChild(line);
        let tw = egret.Tween.get(line);
        tw.to({ width: toWidth }, 300);
        tw.wait(600);
        tw.to({ alpha: 0 , width: 0, ...toPoint}, 300);
        tw.call(() => {
            UI.sceneGame.removeChild(line);
        });
        TargetLine.tw = tw;
    }
}