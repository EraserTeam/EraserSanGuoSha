class Room {
    public unknownCard: Card = new Card(this, Game.unknownCard);
    public cardIDs?: Set<number>;
    public cards: Card[] = [];
    public round = new Round();
    public playerCount = 2;
    public players: Player[] = [];
    public selfPlayer: SelfPlayer;
    public askPlayers: Player[];
    public askingType: AskingType = AskingType.None;
    public askingName: string = '';
    public originalAskingParam: IAskingTypeContent | any;
    public askingParam: IAskingTypeContent | any;
    public askingSkillName: string = '';
    public selectedPlayers: Player[] = [];
    public disposeZone: Card[] = [];
    public syncEvents = new GameSyncEventEmitter();
    private modeName: string = 'StandardIdentityMode';
    private includedComponent: any = {};
    private isIncludingMode: boolean = false;
    public identitiesGuess: Identity[] = [];
    public get socket(): SocketIOClient.Socket {
        return Game.socket;
    }
    public init() {
        UI.others.gameArea.initGeneralAreas(this.playerCount);
        this.initSocket();
    }
    public require(type: RequireType, name: string): any;
    public require(arr: Array<{ type: RequireType, name: string }>): any;
    public require(type: RequireType | Array<{ type: RequireType, name: string }>, name?: any) {
        if (Array.isArray(type)) {
            type.forEach((e) => {
                this.require(e.type, e.name);
            });
            return;
        }
        if (this.includedComponent[type] && this.includedComponent[type][name])
            return;
        let elements: any;
        switch (type) {
            case RequireType.Package:
                elements = Game.packages;
                break;
            case RequireType.CardClass:
                elements = Game.cardClasses;
                break;
            case RequireType.Skill:
                elements = Game.skills;
                break;
            case RequireType.General:
                elements = Game.generals;
                break;
            case RequireType.Mode:
                elements = Game.modes;
                break;
            default:
                return;
        }
        let element = elements[name];
        if (!element)
            throw new Error(`${RequireType[type]} "${name}" does not exist.`);
        if (type == RequireType.Package) {
            for (let cardClassFullName of Object.keys(element.cardClasses)) {
                this.require(RequireType.CardClass, cardClassFullName);
            }
            for (let skillName of Object.keys(element.skills)) {
                this.require(RequireType.Skill, skillName);
            }
            for (let generalName of Object.keys(element.generals)) {
                this.require(RequireType.General, generalName);
            }
        } else {
            if (type == RequireType.Mode && element.abstract && !this.isIncludingMode)
                throw new Error(`An abstract mode "${name}" can only be included by a mode.`);
            if (type == RequireType.General) {
                element.skills.forEach((skillName: string) => {
                    this.require(RequireType.Skill, skillName);
                });
            }
            if (typeof element.init != 'undefined') {
                let temp = this.isIncludingMode;
                this.isIncludingMode = type == RequireType.Mode;
                element.init(this);
                this.isIncludingMode = temp;
            }
        }
        this.includedComponent[type] = this.includedComponent[type] || {};
        this.includedComponent[type][name] = element;
    }
    private initSocket() {
        this.socket.on('game begin', (playerCount: number) => {
            if (UI.sceneRoom.parent) {
				UI.sceneRoom.parent.addChild(UI.sceneGame);
				UI.sceneRoom.parent.removeChild(UI.sceneRoom);
            }
            UI.others.gameArea.initGeneralAreas(playerCount);
            this.initGame();
        });
        this.socket.on('set seatID', (seatID: number) => {
            this.selfPlayer.seatID = seatID;
            this.initPlayers();
        });
        this.socket.on('set seatNum', (seatNums: any[]) => {
            seatNums.forEach(element => {
                this.players[element.seatID].seatNum = element.seatNum;
            });
        });
        this.socket.on('set maxHP', data => {
            this.players[data.seatID].maxHP = data.maxHP;
        });
        this.socket.on('set HP', data => {
            if (data.HP < this.players[data.seatID].HP) {
                Sound.playSound('Hurt');
                if (typeof data.source == 'number')
                    this.playHurtEffect(this.players[data.seatID]);
                this.playLoseHPEffect(this.players[data.seatID], this.players[data.seatID].HP, data.HP);
            }
            this.players[data.seatID].HP = data.HP;
        });
        this.socket.on('set alive', data => {
            if (!data.alive && this.players[data.seatID].general)
                Sound.playDeadSound(this.players[data.seatID].general);
            this.players[data.seatID].alive = data.alive;
        });
        this.socket.on('move card', (data: IMoveCardData) => {
            data.commonCards = this.getCardsByID(data.cardIDs);
            data.realCards = [...data.commonCards];
            data.cards = [...data.commonCards];
            if (data.virtualCardsInfo) {
                data.virtualCards = data.virtualCardsInfo.map(virtualCardInfo =>
                    this.makeVirtualCard(
                        virtualCardInfo.className,
                        this.getCardsByID(virtualCardInfo.cardIDs),
                    ),
                );
                data.cards.push(...data.virtualCards);
                data.realCards.push(...data.virtualCards.reduce((arr: Card[], card) => {
                    arr.push(...card.realCards);
                    return arr;
                }, []));
            } else {
                data.virtualCards = [];
            }
            data.allCards = [...data.virtualCards, ...data.realCards];
            this.moveCardEffect(data);
            this.moveCardSound(data);
            data.allCards.forEach(card => {
                card.zone = data.toZone;
                card.seatID = data.toSeatID;
            });
            if (data.fromZone == Zone.Hand) {
                this.players[data.fromSeatID].removeHandCards(data.cards);
            } else if (data.fromZone == Zone.Dispose) {
                Game.getCardIDs(data.realCards).forEach(cardID => {
                    for (let i = 0; i < this.disposeZone.length; i++) {
                        if (this.disposeZone[i].cardID == cardID) {
                            this.disposeZone.splice(i, 1);
                            i--;
                        }
                    }
                });
            } else if (data.fromZone == Zone.Judge) {
                let fromPlayer = this.players[data.fromSeatID];
                fromPlayer.removeFromJudgeZone([...data.commonCards, ...data.virtualCards]);
            } else if (data.fromZone == Zone.Equip) {
                data.cards.forEach(card => {
                    if (typeof card.class.equipType == 'undefined') return;
                    this.players[data.fromSeatID].setEquip(card.class.equipType, undefined);
                });
            }
            if (data.toZone == Zone.Hand) {
                this.players[data.toSeatID].addHandCards(data.realCards);
            } else if (data.toZone == Zone.Dispose) {
                this.disposeZone.push(...data.realCards);
            } else if (data.toZone == Zone.Judge) {
                this.players[data.toSeatID].addToJudgeZone(data.cards);
            } else if (data.toZone == Zone.Equip) {
                data.cards.forEach(card => {
                    if (typeof card.class.equipType == 'undefined') return;
                    this.players[data.toSeatID].setEquip(card.class.equipType, card);
                });
            }
        });
        this.socket.on('set round', data => {
            this.round.began = false;
            this.round.phase = 0;
            this.round.player = this.players[data.seatID];
            this.refreshPhase();
        });
        this.socket.on('round begin', () => {
            this.round.began = true;
            this.refreshPhase();
        });
        this.socket.on('set phase', data => {
            this.round.phase = data.phase;
            this.refreshPhase();
        });
        this.socket.on('get skill', data => {
            this.players[data.seatID].getSkill(data.skillName);
        });
        this.socket.on('set general', data => {
            this.players[data.seatID].general = Game.getGeneral(data.generalName);
        });
        this.socket.on('set country', data => {
            this.players[data.seatID].country = data.country;
        });
        this.socket.on('set sex', data => {
            this.players[data.seatID].sex = data.sex;
        });
        this.socket.on('set identity', data => {
            this.players[data.seatID].identity = data.identity;
        });
        this.socket.on('set back', data => {
            this.players[data.seatID].back = data.back;
        });
        this.socket.on('set flag', data => {
            this.players[data.seatID].setFlag(data.key, data.value);
        });
        this.socket.on('ask play card', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                this.selfPlayer.askPlaycard();
            }
        });
        this.socket.on('ask discard', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                this.selfPlayer.askDiscard(data.askingName, data.param);
            }
        });
        this.socket.on('ask respond card', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                this.selfPlayer.askRespondCard(data.askingName, data.param);
            }
        });
        this.socket.on('ask use card', data => {
            if (data.seatIDs) {
                if (data.seatIDs.includes(this.selfPlayer.seatID))
                    this.selfPlayer.askUseCard(data.askingName, data.param);
            } else {
                if (data.seatID == this.selfPlayer.seatID)
                    this.selfPlayer.askUseCard(data.askingName, data.param);
            }
        });
        this.socket.on('ask select cards in window', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                let i = 0;
                data.param.cards = data.param.cardIDs.map((cardID: number) => {
                    let className;
                    if (cardID == 0 && (className = data.param.classNames[i++])) {
                        let card = this.makeVirtualCard(className);
                        card.zone = Zone.Judge;
                        return card;
                    } else {
                        return this.getCardByID(cardID);
                    }
                });
                delete data.param.cardIDs;
                this.selfPlayer.askSelectCardsInWindow(data.askingName, data.param);
            }
        });
        this.socket.on('show global cards window', data => {
            new GlobalCardSelectorWindow(data.title, this.getCardsByID(data.cardIDs)).show();
        });
        this.socket.on('set global cards window title', title => {
            UI.sceneGame.globalCardSelectorWindow.title = title;
        });
        this.socket.on('ask select global card in window', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                this.selfPlayer.askSelectGlobalCardInWindow();
            }
        });
        this.socket.on('global card selected', data => {
            UI.sceneGame.globalCardSelectorWindow.dark(data.cardID);
        });
        this.socket.on('close global cards window', () => {
            UI.sceneGame.globalCardSelectorWindow.exit();
        });
        this.socket.on('ask use skill', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                this.selfPlayer.askUseSkill(data.skillName, data.param);
            }
        });
        this.socket.on('ask select suit', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                this.selfPlayer.askSelectSuit(data.askingName, data.param);
            }
        });
        this.socket.on('end ask', () => {
            this.selfPlayer.endAsk();
        });
        this.socket.on('use card', data => {
            let cardClassFullName = data.cardClassFullName;
            let cardClass = Game.cardClasses[cardClassFullName];
            Sound.playCardSound(this.players[data.seatID].sex, cardClassFullName);
            this.playCardEffect(this.players[data.seatID], cardClassFullName, data.color);
            this.showTargetLines(cardClass, this.players[data.seatID], data.selected.map(seatID => this.players[seatID]));
        });
        this.socket.on('respond card', data => {
            let cardClassName = data.cardClassFullName;
            Sound.playCardSound(this.players[data.seatID].sex, cardClassName);
            this.playCardEffect(this.players[data.seatID], cardClassName, data.color);
        });
        this.socket.on('use skill', data => {
            let skill = Game.getSkill(data.skillName);
            Sound.playSkillSound(data.skillName);
            this.playSkillEffect(this.players[data.seatID], data.skillName);
            if (data.selected)
                this.showTargetLines(skill, this.players[data.seatID], data.selected.map(seatID => this.players[seatID]));
        });
        this.socket.on('get dying', seatID => {
            UI.generalArea(seatID).helpMe = true;
        });
        this.socket.on('cancel dying', seatID => {
            UI.generalArea(seatID).helpMe = false;
        });
        this.socket.on('play sound', name => {
            Sound.playSound(name);
        });
        this.socket.on('play effect', data => {
            this.playEffect(this.players[data.seatID], `Effect_${data.name}`, data.pos);
        });
        if (Game.local)
            this.socket.emit('join room', '1111');
    }
    private moveCardEffect(data: IMoveCardData) {
        let fromSelf = data.fromSeatID == this.selfPlayer.seatID;
        let toSelf = data.toSeatID == this.selfPlayer.seatID;
        let refreshDisposeZoneUI = false;
        if (fromSelf) {
            if (data.fromZone == Zone.Hand) {
                Game.getCardIDs(data.realCards).forEach(cardID => {
                    if (UI.sceneGame.disposeZoneUI.some(e => e.data.cardID == cardID))
                        return;
                    let cardUI = UI.self.gameArea.getCardRenderer(cardID);
                    if (!cardUI)
                        return;
                    let list = UI.self.gameArea.list_handCards;
                    let newCardUI = new CardRenderer();
                    newCardUI.data = cardUI.data;
                    newCardUI.data.dark = false;
                    newCardUI.x = UI.self.gameArea.x + list.parent.x + cardUI.x;
                    newCardUI.y = UI.self.gameArea.y + list.parent.y + cardUI.y;
                    UI.sceneGame.group_movingCards.addChild(newCardUI);
                    if (data.toZone == Zone.Hand) {
                        let player = this.players[data.toSeatID];
                        let generalArea = player.generalArea;
                        let y = generalArea.y + 4;
                        egret.Tween.get(newCardUI).to(
                            {
                                x: generalArea.x + generalArea.width / 2 - newCardUI.width / 2,
                                y: generalArea.y + 4,
                            },
                            500,
                        ).call(() => UI.sceneGame.group_movingCards.removeChild(newCardUI));
                    } else {
                        UI.sceneGame.disposeZoneUI.push(newCardUI);
                        refreshDisposeZoneUI = true;
                    }
                });
            } else if (data.fromZone == Zone.Judge || data.fromZone == Zone.Equip) {
                let cover = 0.5;
                let width_all;
                let left;
                let y = UI.self.gameArea.y - 10;
                if (data.toZone == Zone.Hand) {
                    let group = new eui.Group();
                    let height;
                    data.realCards.slice().reverse().every((card, i) => {
                        let cardUI: CardRenderer = new CardRenderer();
                        height = height || cardUI.height;
                        width_all = width_all || cardUI.width * data.realCards.length - cardUI.width * cover * (data.realCards.length - 1);
                        left = left || UI.self.gameArea.x + UI.self.gameArea.width / 2 - width_all / 2;
                        cardUI.data = Game.makeCardUIData(card);
                        cardUI.x = (1 - cover) * cardUI.width * i;
                        cardUI.y = 0;
                        group.addChild(cardUI);
                        return true;
                    });
                    group.x = left;
                    group.y = y;
                    UI.sceneGame.group_movingCards.addChild(group);
                    if (toSelf)
                        egret.Tween.get(group).to(
                            {
                                x: UI.sceneGame.width - width_all - 20,
                                y: UI.sceneGame.height - height - 5,
                            },
                            500,
                        ).call(() => UI.sceneGame.group_movingCards.removeChild(group));
                    else {
                        let generalArea = this.players[data.toSeatID].generalArea;
                        egret.Tween.get(group).to(
                            {
                                x: generalArea.x + generalArea.width / 2 - width_all / 2,
                                y: generalArea.y + 4,
                            },
                            500,
                        ).call(() => UI.sceneGame.group_movingCards.removeChild(group));
                    }
                } else {
                    data.realCards.slice().reverse().every((card, i) => {
                        let cardID = card.cardID;
                        if (UI.sceneGame.disposeZoneUI.some(e => e.data.cardID == cardID))
                            return true;
                        let cardUI: CardRenderer = new CardRenderer();
                        width_all = width_all || cardUI.width * data.realCards.length - cardUI.width * cover * (data.realCards.length - 1);
                        left = left || UI.self.gameArea.x + UI.self.gameArea.width / 2 - width_all / 2;
                        cardUI.data = Game.makeCardUIData(card);
                        cardUI.x = left + (1 - cover) * cardUI.width * i;
                        cardUI.y = y;
                        UI.sceneGame.disposeZoneUI.push(cardUI);
                        UI.sceneGame.group_movingCards.addChild(cardUI);
                        refreshDisposeZoneUI = true;
                        return true;
                    });
                }
            }
        } else if (data.fromSeatID != -1) {
            if (data.fromZone == Zone.Hand || data.fromZone == Zone.Judge || data.fromZone == Zone.Equip) {
                let player = this.players[data.fromSeatID];
                let cover = 0.5;
                let width_all;
                let left;
                let generalArea = player.generalArea;
                let y = generalArea.y + 4;
                if (data.toZone == Zone.Hand) {
                    let group = new eui.Group();
                    let height;
                    data.realCards.slice().reverse().every((card, i) => {
                        let cardUI: CardRenderer = new CardRenderer();
                        height = height || cardUI.height;
                        width_all = width_all || cardUI.width * data.realCards.length - cardUI.width * cover * (data.realCards.length - 1);
                        left = left || generalArea.x + generalArea.width / 2 - width_all / 2;
                        cardUI.data = Game.makeCardUIData(card);
                        cardUI.x = (1 - cover) * cardUI.width * i;
                        cardUI.y = 0;
                        group.addChild(cardUI);
                        return true;
                    });
                    group.x = left;
                    group.y = y;
                    UI.sceneGame.group_movingCards.addChild(group);
                    if (toSelf)
                        egret.Tween.get(group).to(
                            {
                                x: UI.sceneGame.width - width_all - 20,
                                y: UI.sceneGame.height - height - 5,
                            },
                            500,
                        ).call(() => UI.sceneGame.group_movingCards.removeChild(group));
                    else {
                        egret.Tween.get(group).to(
                            {
                                x: generalArea.x + generalArea.width / 2 - width_all / 2,
                                y: generalArea.y + 4,
                            },
                            500,
                        ).call(() => UI.sceneGame.group_movingCards.removeChild(group));
                    }
                } else {
                    data.realCards.slice().reverse().every((card, i) => {
                        let cardID = card.cardID;
                        if (UI.sceneGame.disposeZoneUI.some(e => e.data.cardID == cardID))
                            return true;
                        let cardUI: CardRenderer = new CardRenderer();
                        width_all = width_all || cardUI.width * data.realCards.length - cardUI.width * cover * (data.realCards.length - 1);
                        left = left || generalArea.x + generalArea.width / 2 - width_all / 2;
                        cardUI.data = Game.makeCardUIData(card);
                        cardUI.x = left + (1 - cover) * cardUI.width * i;
                        cardUI.y = y;
                        UI.sceneGame.disposeZoneUI.push(cardUI);
                        UI.sceneGame.group_movingCards.addChild(cardUI);
                        refreshDisposeZoneUI = true;
                        return true;
                    });
                }
            }
        } else {
            if (data.fromZone == Zone.Dispose) {
                if (data.toZone == Zone.Hand) {
                    if (toSelf) {
                        UI.sceneGame.disappearFromDisposeZoneUI(Game.getCardIDs(data.realCards));
                    } else {
                        let player = this.players[data.toSeatID];
                        let cardsUI = UI.sceneGame.disposeZoneUI.filter(cardUI => data.realCards.includes(cardUI.data.cardID));
                        let cover = 0.5;
                        let width_all;
                        let left;
                        let generalArea = player.generalArea;
                        let y = 229;
                        cardsUI.slice().reverse().every((cardUI, i) => {
                            let index = UI.sceneGame.disposeZoneUI.indexOf(cardUI);
                            UI.sceneGame.disposeZoneUI.splice(index, 1);
                            refreshDisposeZoneUI = true;
                            egret.Tween.removeTweens(cardUI);
                            cardUI.tw_moving = cardUI.tw_disappearing = undefined;
                            width_all = width_all || cardUI.width * data.realCards.length - cardUI.width * cover * (data.realCards.length - 1);
                            egret.Tween.get(cardUI).to({
                                x: generalArea.x + generalArea.width / 2 - width_all / 2 + (1 - cover) * cardUI.width * i,
                                y: generalArea.y + 4,
                            }, 300).call(() => {
                                UI.sceneGame.group_movingCards.removeChild(cardUI);
                            });
                            return true;
                        });
                    }
                } else
                    UI.sceneGame.disappearFromDisposeZoneUI(Game.getCardIDs(data.realCards));
            } else if (data.fromZone == Zone.CardPile) {
                if (data.toZone == Zone.Dispose) {
                    data.cards.forEach(card => {
                        if (UI.sceneGame.disposeZoneUI.some(e => e.data.cardID == card.cardID))
                            return;
                        let cardUI: CardRendererWithBack = new CardRendererWithBack(Game.makeCardUIData(card));
                        UI.sceneGame.disposeZoneUI.push(cardUI);
                        UI.sceneGame.group_movingCards.addChild(cardUI);
                        refreshDisposeZoneUI = true;
                    });
                } else if (data.toZone == Zone.Hand) {
                    if (!toSelf) {
                        let player = this.players[data.toSeatID];
                        let cover = 0.5;
                        let width_all;
                        let left;
                        let generalArea = player.generalArea;
                        let y = 229;
                        let group = new eui.Group();
                        Game.getCardIDs(data.realCards).slice().reverse().every((cardID, i) => {
                            let card: any = this.getCardByID(cardID);
                            let cardUI: CardRenderer = new CardRenderer();
                            width_all = width_all || cardUI.width * data.realCards.length - cardUI.width * cover * (data.realCards.length - 1);
                            left = left || 240 + 462 / 2 - width_all / 2;
                            cardUI.data = Game.makeCardUIData(card);
                            cardUI.x = (1 - cover) * cardUI.width * i;
                            cardUI.y = 0;
                            group.addChild(cardUI);
                            return true;
                        });
                        group.x = left;
                        group.y = y;
                        UI.sceneGame.group_movingCards.addChild(group);
                        egret.Tween.get(group).to({
                            x: generalArea.x + generalArea.width / 2 - width_all / 2,
                            y: generalArea.y + 4,
                        }, 300).call(() => {
                            UI.sceneGame.group_movingCards.removeChild(group);
                        });
                    }
                }
            }
        }
        if (data.toZone == Zone.Judge || data.toZone == Zone.Equip) {
            UI.sceneGame.disappearFromDisposeZoneUI(Game.getCardIDs(data.realCards));
        }
        UI.sceneGame.refreshDisposeZoneUI();
    }
    private moveCardSound(data: IMoveCardData) {
        let cards: Card[] = data.cards;
        if (data.toZone == Zone.Equip) {
            cards.forEach(card => {
                switch (card.class.equipType) {
                    case EquipType.Arm:
                        Sound.playSound('EquipArm');
                        break;
                    case EquipType.Armor:
                        Sound.playSound('EquipArm');
                        break;
                    case EquipType.PlusHorse:
                    case EquipType.MinusHorse:
                        Sound.playSound('EquipHorse');
                        break;
                }
            });
        }
    }
    private playEffect(player: Player, name: string, pos: EffectPosition = EffectPosition.General) {
        if (!RES.hasRes(`${name}_json`))
            return;
        let data = RES.getRes(`${name}_json`);
        let txtr = RES.getRes(`${name}_png`);
        let mcFactory = new egret.MovieClipDataFactory(data, txtr);
        let mc = new egret.MovieClip(mcFactory.generateMovieClipData(name));
        let area = UI.bigArea(player.seatID);
        mc.scaleX = 0.8;
        mc.scaleY = 0.6;
        if (pos == EffectPosition.Middle || pos == EffectPosition.Right) {
            mc.x = player == this.selfPlayer ? area.x + (area.width - UI.self.generalArea.width) / 2 : area.x;
            if (pos == EffectPosition.Right)
                mc.x += 70;
            mc.y = area.y + area.height / 2 - (player == this.selfPlayer ? 50 : 0);
            UI.sceneGame.addChild(mc);
            mc.gotoAndPlay(1, 1);
            mc.addEventListener(egret.Event.COMPLETE, () => UI.sceneGame.removeChild(mc), this);
        } else if (pos == EffectPosition.General) {
            UI.generalArea(player.seatID).playEffect(mc);
        }
    }
    private playCardEffect(player: Player, cardClassName: string, color: Color) {
        if (color == Color.None)
            color = Color.Red;
        let names = [`CardEffect_${cardClassName}_${Game.getColorName(color)}`, `CardEffect_${cardClassName}`];
        let name = names.find(name => RES.hasRes(`${name}_json`));
        this.playEffect(player, name, EffectPosition.Middle);
    }
    private playSkillEffect(player: Player, skillName: string) {
        this.playEffect(player, `SkillEffect_${skillName}`, EffectPosition.Right);
    }
    private playHurtEffect(player: Player) {
        let data = RES.getRes('Effect_Hurt_json');
        let txtr = RES.getRes('Effect_Hurt_png');
        let mcFactory = new egret.MovieClipDataFactory(data, txtr);
        let mc = new egret.MovieClip(mcFactory.generateMovieClipData('Effect_Hurt'));
        let bigArea = UI.bigArea(player.seatID);
        let generalArea = UI.generalArea(player.seatID);
        mc.scaleX = 0.7;
        mc.scaleY = 0.5;
        generalArea.playEffect(mc);
    }
    private playLoseHPEffect(player: Player, originalHP: number, HP: number) {
        let data = RES.getRes('Effect_LoseHP_json');
        let txtr = RES.getRes('Effect_LoseHP_png');
        let mcFactory = new egret.MovieClipDataFactory(data, txtr);
        let arr = [];
        let delta = originalHP - HP;
        for (let i = 0; i < delta; i++) {
            let mc = new egret.MovieClip(mcFactory.generateMovieClipData('Effect_LoseHP'));
            mc.scaleX = 0.8;
            mc.scaleY = 0.6;
            arr.push(mc);
        }
        UI.generalArea(player.seatID).HPArea.playLoseHPEffect(originalHP, HP, arr);
    }
    private showTargetLines(component: ICardClass | ISkill, player: Player, selected: Player[]) {
        component.showTargetLines(player, selected, this.showTargetLine);
    }
    private showTargetLine = (from: Player, to: Player, wait: number = 0) => {
        if (from == to) return;
        if (wait) {
            egret.setTimeout(() => {
                TargetLine.show(from.bigArea, to.bigArea);
            }, this, wait * 2000);
        } else {
            TargetLine.show(from.bigArea, to.bigArea);
        }
    }
    public initGame() {
        this.disposeZone = [];
        this.players = [];
        if (this.selfPlayer) {
            this.selfPlayer.removeHandCards([...this.selfPlayer.hand]);
            this.selfPlayer.removeFromJudgeZone([...this.selfPlayer.judgeZone]);
            this.selfPlayer.setEquip(EquipType.Arm, undefined);
            this.selfPlayer.setEquip(EquipType.Armor, undefined);
            this.selfPlayer.setEquip(EquipType.PlusHorse, undefined);
            this.selfPlayer.setEquip(EquipType.MinusHorse, undefined);
            this.selfPlayer.identity = Identity.Unknown;
            this.selfPlayer.back = false;
            let oldSeatID = this.selfPlayer.seatID;
            this.selfPlayer = new SelfPlayer();
            this.selfPlayer.seatID = oldSeatID;
            this.selfPlayer.endAsk();
            this.selfPlayer.seatID = -1;
        } else {
            this.selfPlayer = new SelfPlayer();
            this.selfPlayer.endAsk();
        }
        this.round.player = undefined;
        this.round.began = false;
        this.round.phase = 0;
        UI.self.generalArea.helpMe = false;
        if (UI.sceneGame.globalCardSelectorWindow)
            UI.sceneGame.globalCardSelectorWindow.exit();
        UI.sceneGame.disposeZoneUI.forEach((cardUI: CardUI) => {
            UI.sceneGame.group_movingCards.removeChild(cardUI);
        });
        UI.sceneGame.disposeZoneUI = [];
        UI.self.generalArea.skills = [];
        this.initEvents();
        this.cards = [];
        this.cardIDs.forEach((cardID) => {
            let card = new Card(this, Game.getCardByID(cardID));
            card.zone = Zone.CardPile;
            this.cards.push(card);
        });
        delete this.cardIDs;
    }
    private initEvents() {
        this.includedComponent = {};
        this.syncEvents = new GameSyncEventEmitter();
        this.cardIDs = new Set<number>();
        this.require(RequireType.Package, 'predefined');
        this.require(RequireType.Mode, this.modeName);
    }
    public initPlayers() {
        for (let i = 0; i < this.playerCount; i++) {
            let player: Player = i == this.selfPlayer.seatID ? this.selfPlayer : new Player();
            player.seatID = i;
            this.players.push(player);
        }
    }
    public get alivePlayers(): Player[] {
        return this.players.filter(player => player.alive);
    }
    public refreshPhase() {
        this.players.forEach(element => {
            element.refreshPhase();
        });
    }
    public getCardByID(id: number): Card {
        if (id == 0) return this.unknownCard;
        let card = this.cards.find(e => e.cardID == id);
        card = card || this.unknownCard;
        return card;
    }
    public getCardsByID(IDs: number[]): Card[] {
        return IDs.map(ID => this.getCardByID(ID));
    }
    public makeVirtualCard(className: string, realCards: Card[] = []): Card {
        let card = new Card(this, {
            cardID: 0,
            class: className,
            number: realCards.length == 1 ? realCards[0].number : 0,
            suit: Suit.None,
        });
        card.virtual = true;
        card.realCards = realCards;
        return card;
    }
    public makeUnknownCards(n: number): Card[] {
        return new Array(n).fill(this.unknownCard);
    }
    public askingMatch(askingType: AskingType, askingName?: string) {
        if (askingType == AskingType.UseSkill) {
            return askingName && askingName == this.askingSkillName;
        }
        if (askingType != this.askingType) {
            return false;
        } else if (askingName && askingName != this.askingName) {
            return false;
        }
        return true;
    }
}
interface IMoveCardData {
    fromSeatID: number;
    toSeatID: number;
    fromZone: Zone;
    toZone: Zone;
    cardIDs: number[];
    virtualCardsInfo?: Array<{
        className: string;
        cardIDs: number[];
    }>;
    virtualCards: Card[]; //虚拟牌
    commonCards: Card[]; //普通牌，即无所属虚拟牌的实体牌
    cards: Card[]; //虚拟牌和普通牌
    realCards: Card[]; //实体牌
    allCards: Card[]; //所有牌
}