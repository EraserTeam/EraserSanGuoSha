class SelfPlayer extends Player {
    constructor() {
        super();
    }
    protected get self() {
        return true;
    }
    protected handCardsChange() {
        UI.self.gameArea.handCardsCollection.removeAll();
        this.hand.forEach(card => {
            UI.self.gameArea.handCardsCollection.addItem(Game.makeCardUIData(card));
        });
        super.handCardsChange();
    }
    public getSkill(skill: Skill | string) {
        super.getSkill(skill as any);
        UI.self.generalArea.skills = this.skills;
    }
    private makeAskingParam(askingType: AskingType, askingName: string, param?: any): any {
        let askingParam = Object.assign({}, Game.getAskingTypeContents(askingType));
        if (askingType != AskingType.UseSkill) {
            let asking = Game.getAsking(askingName);
            Object.assign(askingParam, asking && asking.param);
        }
        Object.assign(askingParam, param);
        return askingParam;
    }
    private initAskingParam(param?: any) {
        this.room.askingParam = this.makeAskingParam(this.room.askingType, this.room.askingName, param);
    }
    public askPlaycard() {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.PlayCard;
        this.room.askingName = '';
        this.initAskingParam();
        this.applyAsking();
    }
    public askDiscard(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.Discard;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        this.applyAsking();
    }
    public askRespondCard(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.RespondCard;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        this.applyAsking();
    }
    public askUseCard(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.UseCard;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        this.applyAsking();
    }
    public askSelectCardsInWindow(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.SelectCardInWindow;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        let [hand, equip, judge] = [[], [], []];
        this.room.askingParam.cards.forEach(card => {
            if (card.zone == Zone.Equip) {
                equip.push(card);
            } else if (card.zone == Zone.Judge) {
                judge.push(card);
            } else {
                hand.push(card);
            }
        });
        new CardSelectorWindow({
            title: this.room.askingParam.title ? this.room.askingParam.title() : '',
            cardCount: this.room.askingParam.cardCount,
            hand,
            equip,
            judge,
        }).show();
    }
    public askSelectGlobalCardInWindow() {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.SelectGlobalCardInWindow;
        this.room.askingName = '';
        UI.sceneGame.globalCardSelectorWindow.canSelect = true;
    }
    public askUseSkill(skillName: string, param?: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.UseSkill;
        this.room.askingSkillName = skillName;
        this.initAskingParam(param);
        this.applyAsking();
    }
    public askSelectSuit(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.SelectSuit;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        this.applyAsking();
    }
    public applyAsking() {
        let askingParam;
        if (this.room.originalAskingParam) {
            askingParam = this.makeAskingParam(AskingType.UseSkill, '');
        } else {
            askingParam = this.room.askingParam;
        }
        UI.self.gameArea.maxSelectCount = askingParam.maxCardCount(Game.room.selfPlayer);
        UI.self.gameArea.minSelectCount = askingParam.minCardCount(Game.room.selfPlayer);
        UI.self.gameArea.selectedCards = [];
        UI.self.gameArea.refreshEquipCanSelect();
        this.equipZoneCards.forEach(equip => {
            let skillName = `$${equip.class.name}`;
            let skill = this.skills.find(skill => skill.name == skillName) || Game.getSkill(skillName);
            if (Game.room.selfPlayer.hasSkill(skillName) && skill.enabled(this)) {
                if (this.room.askingSkillName && this.room.askingSkillName != skillName)
                    return;
                let select = skill.filterCard != Package.skillFilterCardDefault || skill.filterSelect;
                let askUseSkill = !!this.room.originalAskingParam;
                if (!select) {
                    UI.self.gameArea.equipUI[equip.class.equipType].setCallback({
                        selected: () => {
                            Game.room.selfPlayer.answer({
                                skill: skill.name,
                            });
                        },
                    });
                } else {
                    UI.self.gameArea.equipUI[equip.class.equipType].setCallback({
                        unselected: () => {
                            if (askUseSkill) {
                                this.answerNo();
                            } else {
                                Game.room.selfPlayer.applyAsking();
                            }
                        },
                        selected: () => {
                            Game.room.selfPlayer.turnToUseSkill(skill.name);
                        },
                    });
                }
                if (askUseSkill && select)
                    UI.self.gameArea.equipUI[equip.class.equipType].selected = true;
            }
        });
        UI.self.gameArea.refreshCardStatus();
        UI.self.gameArea.clearSelectedHandCards();
        UI.self.operationArea.refreshButtonStatus();
        UI.self.generalArea.cancelSelectedSkill();
        UI.self.generalArea.refreshSkillButtons();
        UI.sceneGame.clearPlayerSelect();
        UI.sceneGame.refreshPlayerSelect();
        UI.sceneGame.refreshTip();
    }
    public turnToUseSkill(skillName: string = '') {
        this.room.askingSkillName = skillName;
        if (skillName) {
            this.room.originalAskingParam = this.room.askingParam;
            this.room.askingParam = this.makeAskingParam(AskingType.UseSkill, '');
        } else {
            this.room.askingParam = this.room.originalAskingParam;
            this.room.originalAskingParam = undefined;
        }
        this.applyAsking();
    }
    private getAnswerEventName() {
        switch (Game.room.askingType) {
            case AskingType.UseCard:
            case AskingType.PlayCard:
                return 'use card';
            case AskingType.Discard:
                return 'discard';
            case AskingType.RespondCard:
                return 'respond card';
            case AskingType.UseSkill:
                return 'use skill';
            case AskingType.SelectSuit:
                return 'select suit';
            default:
                throw new Error('unknown askingType');
        }
    }
    public answer(data: any) {
        Game.socket.emit(this.getAnswerEventName(), data);
        this.endAsk();
    }
    public answerNo() {
        let event;
        if (Game.room.askingType == AskingType.PlayCard) {
            event = 'end play card';
        } else {
            event = `do not ${this.getAnswerEventName()}`;
        }
        Game.socket.emit(event);
        this.endAsk();
    }
    public endAsk() {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.None;
        this.room.askingName = '';
        this.room.originalAskingParam = undefined;
        this.room.askingParam = undefined;
        this.room.askingSkillName = '';
        UI.self.gameArea.selectedCards = [];
        UI.self.gameArea.maxSelectCount = UI.self.gameArea.maxSelectCount = 0;
        UI.self.gameArea.refreshCardStatus();
        UI.self.gameArea.equipUI.forEach(e => e.canSelect = false);
        UI.self.gameArea.clearSelectedHandCards();
        UI.self.operationArea.refreshButtonStatus();
        UI.self.generalArea.cancelSelectedSkill();
        UI.self.generalArea.refreshSkillButtons();
        UI.sceneGame.clearPlayerSelect();
        UI.sceneGame.refreshTip();
    }
}