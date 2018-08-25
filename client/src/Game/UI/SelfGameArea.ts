class SelfGameArea extends eui.Component {
    public list_handCards: eui.List;
    public generalArea: SelfGeneralArea;
    public img_phase: eui.Image;
    public equipUI0: SelfEquip;
    public equipUI1: SelfEquip;
    public equipUI2: SelfEquip;
    public equipUI3: SelfEquip;
    public cardCountLabel: CardCountLabel;
    public handCardsCollection: eui.ArrayCollection = new eui.ArrayCollection();
    public minSelectCount: number = 0;
    public maxSelectCount: number = 0;
    public selectedCards: Card[] = [];
    private judgeZoneUI: JudgeZoneFlag[] = [];
    private _identity: Identity;
    private img_deadFlag: eui.Image;
    public constructor() {
        super();
        this.addEventListener(egret.Event.COMPLETE, this.onComplete, this);
    }
    public get equipUI() {
        return [this.equipUI0, this.equipUI1, this.equipUI2, this.equipUI3];
    }
    public set country(country: Country) {
        this.cardCountLabel.country = country;
        this.generalArea.country = country;
    }
    public set identity(identity: Identity) {
        this._identity = identity;
        this.generalArea.identity = identity;
    }
    public set alive(alive: boolean) {
        this.generalArea.alive = alive;
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
    private onComplete(e) {
        this.list_handCards.addEventListener(eui.ItemTapEvent.ITEM_TAP, this.onChangeHand, this);
        this.list_handCards.dataProvider = this.handCardsCollection;
    }
    private onChangeHand(evt: eui.ItemTapEvent) {
        let item = this.list_handCards.dataProvider.getItemAt(evt.itemIndex);
        let selected = this.list_handCards.selectedItems.includes(item);
        if (selected) {
            this.selectedCards.push(Game.room.getCardByID(item.cardID));
            let selectedCount = this.selectedCount;
            if (selectedCount > this.maxSelectCount) {
                let delta = selectedCount - this.maxSelectCount;
                this.cancelSelectCards(delta);
            }
        } else {
            this.selectedCards = this.selectedCards.filter(e => e.zone != Zone.Hand || e.cardID != item.cardID);
        }
        this.onChange();
    }
    public onChangeEquip(equipType: EquipType, selected: boolean) {
        let card = Game.room.selfPlayer.equipZone[equipType];
        if (selected) {
            this.selectedCards.push(card);
            let selectedCount = this.selectedCount;
            if (selectedCount > this.maxSelectCount) {
                let delta = selectedCount - this.maxSelectCount;
                this.cancelSelectCards(delta);
            }
        } else {
            this.selectedCards = this.selectedCards.filter(e => e.zone != Zone.Equip || e.cardID != card.cardID);
        }
        this.onChange();
    }
    private cancelSelectCards(n: number) {
        let deleted = this.selectedCards.splice(0, n);
        this.list_handCards.selectedItems = this.list_handCards.selectedItems.filter(
            item => deleted.every(e => e.zone != Zone.Hand || e.cardID != item.cardID),
        );
        Game.room.selfPlayer.equipZone.forEach(equip => {
            if (equip && deleted.some(e => e.zone == Zone.Equip && e.cardID == equip.cardID))
                this.equipUI[equip.class.equipType].selected = false;
        });
    }
    private onChange() {
        UI.self.operationArea.refreshButtonStatus();
        UI.sceneGame.clearPlayerSelect();
        UI.sceneGame.refreshPlayerSelect();
        this.refreshSelectedItem();
        UI.sceneGame.refreshTip();
    }
    public refreshSelectedItem() {
        for (let i = 0; i < this.list_handCards.dataProvider.length; i++) {
            let element = this.list_handCards.getElementAt(i) as CardRenderer;
            element.refreshStyle(this.list_handCards.selectedItems.some(e => e == element.data));
        }
    }
    public get selectedCount(): number {
        return this.selectedCards.length;
    }
    public get selectedCardIDs(): number[] {
        return Game.getCardIDs(this.selectedCards);
    }
    public get selectCorrectly(): boolean {
        if (!Game.room) return;
        if (this.selectedCount < this.minSelectCount || this.selectedCount > this.maxSelectCount)
            return false;
        let cards = UI.self.gameArea.selectedCards;
        let selected: Player[] = Game.room.selectedPlayers;
        return Game.room.askingParam.selectCorrectly(cards, Game.room.selfPlayer, selected);
    }
    public cancelSelection() {
        this.selectedCards = [];
        let cards = Game.room.selfPlayer.equipZoneCards;
        cards = cards.filter(e => Game.room.askingSkillName != `$${e.class.name}`);
        cards.map(card => card.class.equipType).forEach(equipType => {
            this.equipUI[equipType].selected = false;
        });
        this.list_handCards.selectedItems = [];
        UI.self.operationArea.refreshButtonStatus();
        this.refreshSelectedItem();
    }
    private getEnabledCards() {
        let cards = [...Game.room.selfPlayer.hand, ...Game.room.selfPlayer.equipZoneCards];
        let selectedCards = this.selectedCards;
        cards = cards.filter(card => !selectedCards.includes(card));
        if (Game.room.askingParam) {
            if (Game.room.askingParam.maxCardCount(Game.room.selfPlayer) == 0)
                cards = [];
            else {
                cards = Game.room.askingParam.filterCard(Game.room.selfPlayer, this.selectedCards, cards);
            }
        }
        return cards;
    }
    public refreshCardStatus() {
        let enabledCards = this.getEnabledCards();
        let hcc = this.handCardsCollection;
        for (let i = 0; i < hcc.length; i++) {
            let item = hcc.getItemAt(i);
            let card = Game.room.getCardByID(item.cardID);
            let status;
            if (Game.room.askingParam) {
                let dark = !enabledCards.includes(card);
                status = {
                    dark,
                    disabled: dark,
                };
            } else {
                status = {
                    dark: false,
                    disabled: true,
                };
            }
            item.dark = status.dark;
            item.disabled = status.disabled;
            hcc.replaceItemAt(item, i);
        }
    }
    public refreshEquipCanSelect() {
        let enabledCards = this.getEnabledCards();
        let equipZoneCards = Game.room.selfPlayer.equipZoneCards;
        let cards = equipZoneCards.filter(e => {
            if (Game.room.askingSkillName == `$${e.class.name}`)
                return true;
            if (enabledCards.includes(e))
                return true;
            return false;
        });
        cards.map(card => card.class.equipType).forEach(equipType => {
            this.equipUI[equipType].setCallback({
                unselected: () => {
                    this.onChangeEquip(equipType, false);
                },
                selected: () => {
                    this.onChangeEquip(equipType, true);
                },
            });
        });
        let disabledCards = Game.room.selfPlayer.equipZoneCards.filter(e => !cards.includes(e));
        disabledCards.map(card => card.class.equipType).forEach(equipType => {
            this.equipUI[equipType].canSelect = false;
        });
    }
    public clearSelectedHandCards() {
        UI.self.gameArea.list_handCards.selectedItems = [];
        UI.self.gameArea.refreshSelectedItem();
    }
    public getCardRenderer(cardID: number) {
        for (let i = 0; i < this.list_handCards.dataProvider.length; i++) {
            let element = this.list_handCards.getElementAt(i) as CardRenderer;
            if (element.data.cardID == cardID)
                return element;
        }
    }
    private static getJudgeZoneCardPicName(cardClass: string) {
        return `Big${cardClass}_png`;
    }
    public addToJudgeZoneUI(cardClass: string) {
        let flag = new JudgeZoneFlag();
        flag.width = 25;
        flag.height = 25;
        flag.right = this.width;
        flag.y = 0;
        flag.source = SelfGameArea.getJudgeZoneCardPicName(cardClass);
        this.addChild(flag);
        this.judgeZoneUI.push(flag);
        this.refreshJudgeZoneUI();
    }
    public removeFromJudgeZoneUI(cardClass: string) {
        let picName = SelfGameArea.getJudgeZoneCardPicName(cardClass);
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
            let toRight = 905 + index * (flag.width + offset);
            if (!flag.toRight || flag.toRight != toRight) {
                flag.toRight = toRight;
                egret.Tween.removeTweens(flag);
                egret.Tween.get(flag).to({ right: toRight }, 300);
            }
            return true;
        });
    }
}
