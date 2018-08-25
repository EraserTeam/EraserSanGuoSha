class CardSelectorWindow extends GameWindow {
    public cardLabelUI: Array<{ zone: Zone; group: eui.Group; img: eui.Image; label: eui.Label; scroller: eui.Scroller; list: eui.List }> = [];
    private hand: Card[] | undefined;
    private equip: Card[] | undefined;
    private judge: Card[] | undefined;
    public cardCount: number;
    public constructor(param: { title: string, cardCount: number, hand?: Card[], equip?: Card[], judge?: Card[] }) {
        super(param.title);
        this.cardCount = param.cardCount;
        this.hand = param.hand;
        this.equip = param.equip;
        this.judge = param.judge;
        let cnt = 0;
        if (this.hand.length) cnt++;
        if (this.equip.length) cnt++;
        if (this.judge.length) cnt++;
        this.height = 46 + cnt * 88;
    }
    protected childrenCreated() {
        super.childrenCreated();
        if (this.hand.length)
            this.createCardLabel(Zone.Hand, '手牌', this.hand);
        if (this.equip.length)
            this.createCardLabel(Zone.Equip, '装备', this.equip);
        if (this.judge.length)
            this.createCardLabel(Zone.Judge, '延时锦囊', this.judge);
    }
    private createCardLabel(zone: Zone, labelText: string, cards: Card[]) {
        let y = this.cardLabelUI.length * 88;
        let [group, img, label, scroller, list] = [new eui.Group(), new eui.Image(), new eui.Label(), new eui.Scroller(), new eui.List()];
        group.y = y;
        group.percentWidth = 100;
        group.height = 84;
        img.left = 0;
        img.verticalCenter = 0;
        img.width = 14;
        img.height = 60;
        img.source = 'WindowCardLabelBG_png';
        group.addChild(img);
        label.text = labelText;
        label.x = 2;
        label.verticalCenter = 0;
        label.width = 10;
        label.height = 50;
        label.size = 10;
        label.verticalAlign = 'middle';
        label.textAlign = 'middle';
        label.fontFamily = 'Microsoft YaHei';
        label.textColor = 0xe4d5a0;
        group.addChild(label);
        scroller.left = 24;
        scroller.right = 0;
        scroller.height = 84;
        scroller.scrollPolicyH = 'auto';
        scroller.scrollPolicyV = 'off';
        scroller.addEventListener(egret.TouchEvent.TOUCH_BEGIN, () => {
            this.enableDrog = false;
        }, this);
        scroller.addEventListener(egret.TouchEvent.TOUCH_END, () => {
            this.enableDrog = true;
        }, this);
        scroller.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, () => {
            this.enableDrog = true;
        }, this);
        list.allowMultipleSelection = true;
        list.itemRenderer = FixedCardRenderer;
        list.useVirtualLayout = false;
        let layout = new eui.HorizontalLayout();
        layout.gap = 0;
        layout.paddingLeft = 2;
        layout.paddingTop = 1;
        layout.paddingBottom = 1;
        list.layout = layout;
        let datas = cards.map(card => {
            let data = Game.makeCardUIData(card);
            data.disabled = false;
            return data;
        });
        list.dataProvider = new eui.ArrayCollection(datas);
        list.addEventListener(eui.ItemTapEvent.ITEM_TAP, this.onChange, this);
        scroller.viewport = list;
        group.addChild(scroller);
        this.cardLabelUI.push({
            zone,
            group,
            img,
            label,
            scroller,
            list,
        });
        this.body.addChild(group);
    }
    public get selectedCount(): number {
        let cnt = 0;
        this.cardLabelUI.forEach(ui => {
            cnt += ui.list.selectedItems.length;
        });
        return cnt;
    }
    private onChange() {
        if (this.selectedCount == this.cardCount) {
            let cardIDs = [];
            let classNames = [];
            this.cardLabelUI.forEach(ui => {
                ui.list.selectedItems.every((e, i) => {
                    cardIDs.push(e.cardID);
                    if (ui.zone == Zone.Judge && this.judge[ui.list.selectedIndices[i]].virtual) {
                        classNames.push(this.judge[ui.list.selectedIndices[i]].class.name);
                    }
                    return true;
                });
            });
            Game.socket.emit('select cards', {
                cardIDs,
                classNames,
            });
            Game.room.selfPlayer.endAsk();
            this.exit();
        }
    }
}