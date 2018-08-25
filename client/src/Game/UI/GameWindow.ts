class GameWindow extends DrogComponent {
    private lb_title: eui.Label;
    public body: eui.Group;
    public constructor(title?: string) {
        super();
        this.addEventListener(egret.Event.COMPLETE, () => {
            if (title)
                this.title = title;
        }, this);
        this.skinName = 'GameWindowSkin';
    }
    public get title() {
        return this.lb_title.text;
    }
    public set title(title: string) {
        this.lb_title.textFlow = (new egret.HtmlTextParser()).parser(title);
    }
    public show() {
        let othersGameArea = UI.others.gameArea;
        this.x = othersGameArea.x + (othersGameArea.width - this.width) / 2;
        this.y = othersGameArea.y + (othersGameArea.height - this.height) / 2;
        UI.sceneGame.group_top.addChild(this);
    }
    public exit() {
        UI.sceneGame.group_top.removeChild(this);
    }
}