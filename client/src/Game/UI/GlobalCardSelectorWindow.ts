class GlobalCardSelectorWindow extends GameWindow {
    public cards: Card[];
    public _canSelect = false;
    public cardsUI: CardRenderer[] = [];
    public constructor(title: string, cards: Card[]) {
        super(title);
        this.cards = cards;
        let lineCnt = cards.length > 4 ? 2 : 1;
        let maxOneLineCnt = cards.length > 4 ? 4 : cards.length;
        this.height = 46 + lineCnt * 88;
        let w = 30 + maxOneLineCnt * 68;
        if (w < 220) w = 220;
        this.width = w;
        UI.sceneGame.globalCardSelectorWindow = this;
    }
    protected childrenCreated() {
        super.childrenCreated();
        let x = 0;
        let y = 0;
        let group: eui.Group;
        this.cards.every((card, index) => {
            if (!group) {
                group = new eui.Group();
                group.y = y;
                group.horizontalCenter = 0;
                group.addEventListener(egret.TouchEvent.TOUCH_BEGIN, () => {
                    this.enableDrog = false;
                }, this);
                group.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
                    this.enableDrog = true;
                }, this);
                group.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, () => {
                    this.enableDrog = true;
                }, this);
                this.body.addChild(group);
            }
            let cardUI = new FixedCardRenderer();
            cardUI.x = x;
            cardUI.y = 0;
            let data = Game.makeCardUIData(card);
            data.disabled = true;
            cardUI.data = data;
            cardUI.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
                this.onSelected(cardUI);
            }, this);
            this.cardsUI.push(cardUI);
            group.addChild(cardUI);
            if (index % 4 == 3) {
                x = 0;
                y += cardUI.height + 3;
                group = undefined;
            } else
                x += cardUI.width;
            return true;
        });
    }
    public get canSelect() {
        return this._canSelect;
    }
    public set canSelect(bool: boolean) {
        this._canSelect = bool;
        this.cardsUI.forEach(cardUI => {
            let data = cardUI.data;
            data.disabled = !bool || data.dark;
            cardUI.data = data;
        });
    }
    public dark(cardID: number) {
        this.cardsUI.forEach(cardUI => {
            if (cardUI.data.cardID == cardID) {
                let data = cardUI.data;
                data.dark = true;
                cardUI.data = data;
            }
        });
    }
    private onSelected(cardUI: CardRenderer) {
        if (!this.canSelect) return;
        if (cardUI.data.dark) return;
        Game.socket.emit('select card', cardUI.data.cardID);
        this.canSelect = false;
        Game.room.selfPlayer.endAsk();
    }
    public exit() {
        super.exit();
        UI.sceneGame.globalCardSelectorWindow = undefined;
    }
}