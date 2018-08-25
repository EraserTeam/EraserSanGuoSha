class Predefined {
    public static pkg: Package;
    public static init() {
        Predefined.pkg = Game.createPackage('predefined');
        Predefined.initAskingTypeContents();
        Predefined.pkg.createSkill({
            name: '$PlusHorse',
            type: SkillType.Lock,
            init: (room: Room) => {
                room.syncEvents.on(GameSyncEvent.CalcDistance, (fromPlayer: Player, toPlayer: Player, distance: number) => {
                    if (toPlayer.hasSkill('$PlusHorse')) {
                        return distance + 1;
                    }
                });
            },
        });
        Predefined.pkg.createSkill({
            name: '$MinusHorse',
            type: SkillType.Lock,
            init: (room: Room) => {
                room.syncEvents.on(GameSyncEvent.CalcDistance, (fromPlayer: Player, toPlayer: Player, distance: number) => {
                    if (fromPlayer.hasSkill('$MinusHorse')) {
                        return distance - 1;
                    }
                });
            },
        });
    }
    public static createPlusHorse(pkg: Package, obj: any) {
        Predefined.createHorse(true, pkg, obj);
    }
    public static createMinusHorse(pkg: Package, obj: any) {
        Predefined.createHorse(false, pkg, obj);
    }
    private static createHorse(isPlusHorse: boolean, pkg: Package, obj: any) {
        Object.keys(obj).forEach(name => {
            let tipName = obj[name];
            pkg.createCardClass({
                name,
                tipName,
                type: CardType.Equip,
                equipType: isPlusHorse ? EquipType.PlusHorse : EquipType.MinusHorse,
                enabled: true,
                tip: `装备${tipName}后，${isPlusHorse ? '你防守时其他角色与你的距离会+1' : '你进攻时与其他角色的距离会-1'}`,
                init: (room: Room) => {
                    room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                        if (skillName == (isPlusHorse ? '$PlusHorse' : '$MinusHorse'))
                            return player.hasEquip(name);
                    });
                },
            });
        });
    }
    private static initAskingTypeContents() {
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.Discard,
            tip: () => `您需要弃置 ${Game.room.askingParam.maxCount}张卡牌`,
            minCardCount: (player: Player) => player.room.askingParam.minCount,
            maxCardCount: (player: Player) => player.room.askingParam.maxCount,
            filterCard: (player: Player, selectedCards: Card[], cards: Card[]): Card[] => cards.filter(card => card.inHand),
            btnStatus: {
                ok: {
                    visible: () => true,
                    enabled: () => UI.self.gameArea.selectCorrectly,
                    onClick: () =>
                        Game.room.selfPlayer.answer(UI.self.gameArea.selectedCardIDs)
                    ,
                },
                cancel: {
                    visible: () => true,
                    enabled: () => UI.self.gameArea.selectedCount > 0,
                    onClick: () => UI.self.gameArea.cancelSelection(),
                },
                over: {
                    visible: () => false,
                },
            },
        });
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.PlayCard,
            tip: () => {
                if (UI.self.gameArea.selectedCount == 0) {
                    return '出牌阶段，请选择一张卡牌';
                } else {
                    let card = UI.self.gameArea.selectedCards[0];
                    return card.class.tip(card);
                }
            },
            maxCardCount: 1,
            filterCard: (player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
                cards.filter(card => card.inHand && player.cardEnabled(card))
            ,
            filterSelect: (cards: Card[], player: Player, selected: Player[], targets: Player[]): Player[] | false => {
                if (cards.length < player.room.askingParam.minCardCount(player))
                    return false;
                let card = cards[0];
                if (card.class.filterSelect)
                    return player.cardFilterSelect(card, selected, targets);
                else
                    return false;
            },
            selectCorrectly: (cards: Card[], player: Player, selected: Player[]) => {
                let card = cards[0];
                if (cards.length == 1)
                    return player.cardSelectCorrectly(card, selected);
                else
                    return false;
            },
            btnStatus: {
                ok: {
                    visible: () => true,
                    enabled: () => UI.self.gameArea.selectCorrectly,
                    onClick: () =>
                        Game.room.selfPlayer.answer({
                            cardID: UI.self.gameArea.selectedCardIDs[0],
                            selected: Game.room.selectedPlayers.map(player => player.seatID),
                        })
                    ,
                },
                cancel: {
                    visible: () => true,
                    enabled: () => UI.self.gameArea.selectedCount > 0,
                    onClick: () => UI.self.gameArea.cancelSelection(),
                },
                over: {
                    visible: () => true,
                    enabled: () => true,
                    onClick: () => Game.room.selfPlayer.answerNo(),
                },
            },
        });
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.RespondCard,
            maxCardCount: 1,
            filterCard: (player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
                cards.filter(card => card.inHand && player.room.askingParam.cardClassName == card.class.name)
            ,
            btnStatus: {
                ok: {
                    visible: () => true,
                    enabled: () => UI.self.gameArea.selectCorrectly,
                    onClick: () =>
                        Game.room.selfPlayer.answer({
                            cardID: UI.self.gameArea.selectedCardIDs[0],
                        })
                    ,
                },
                cancel: {
                    visible: () => true,
                    enabled: () => true,
                    onClick: () => Game.room.selfPlayer.answerNo(),
                },
                over: {
                    visible: () => false,
                },
            },
        });
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.UseCard,
            tip: () => Game.room.askingParam.tip,
            maxCardCount: 1,
            filterCard: (player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
                cards.filter(card => card.inHand && player.room.askingParam.cardClassName == card.class.name)
            ,
            btnStatus: {
                ok: {
                    visible: () => true,
                    enabled: () => UI.self.gameArea.selectCorrectly,
                    onClick: () =>
                        Game.room.selfPlayer.answer({
                            cardID: UI.self.gameArea.selectedCardIDs[0],
                        })
                    ,
                },
                cancel: {
                    visible: () => true,
                    enabled: () => true,
                    onClick: () => Game.room.selfPlayer.answerNo(),
                },
                over: {
                    visible: () => false,
                },
            },
        });
        let skillViewAs = (player: Player): Card | undefined => {
            let skill = Game.getSkill(player.room.askingSkillName);
            let cards = UI.self.gameArea.selectedCards;
            let selected = player.room.selectedPlayers;
            return skill.viewAs && skill.viewAs(
                skill,
                player,
                cards,
                selected,
                player.room.askingParam,
            );
        };
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.UseSkill,
            tip: () => {
                let skill = Game.getSkill(Game.room.askingSkillName);
                let tip = skill.tip(skill);
                if (tip)
                    return tip;
                else
                    return skill.tipName ? `您是否使用 ${skill.tipName}` : '';
            },
            minCardCount: (player: Player) => {
                let skill = Game.getSkill(player.room.askingSkillName);
                return skill.minCardCount;
            },
            maxCardCount: (player: Player) => {
                let skill = Game.getSkill(player.room.askingSkillName);
                return skill.maxCardCount;
            },
            filterCard: (player: Player, selectedCards: Card[], cards: Card[]): Card[] => {
                let skill = Game.getSkill(player.room.askingSkillName);
                return skill.filterCard(skill, player, selectedCards, cards);
            },
            filterSelect: (cards: Card[], player: Player, selected: Player[], targets: Player[]): Player[] | false => {
                if (cards.length < UI.self.gameArea.minSelectCount)
                    return false;
                let skill = Game.getSkill(player.room.askingSkillName);
                if (skill.filterSelect) {
                    return skill.filterSelect(skill, player, cards, selected, targets);
                } else {
                    let card = skillViewAs(player);
                    if (player.room.askPlayers.includes(player) && player.room.askingType == AskingType.PlayCard && card && card.class.filterSelect) {
                        return player.cardFilterSelect(card, selected, targets);
                    } else {
                        return false;
                    }
                }
            },
            selectCorrectly: (cards: Card[], player: Player, selected: Player[]) => {
                let skill = Game.getSkill(player.room.askingSkillName);
                let card = skillViewAs(player);
                let selectCorrectly = true;
                if (card && player.room.askPlayers.includes(player) && player.room.askingType == AskingType.PlayCard) {
                    selectCorrectly = player.cardSelectCorrectly(card, selected);
                }
                if (selectCorrectly) {
                    selectCorrectly = skill.selectCorrectly(skill, player, cards, selected);
                }
                return selectCorrectly;
            },
            btnStatus: {
                ok: {
                    visible: () => true,
                    enabled: () => UI.self.gameArea.selectCorrectly,
                    onClick: () =>
                        Game.room.selfPlayer.answer({
                            skill: Game.room.askingSkillName,
                            skillParam: {
                                cardIDs: UI.self.gameArea.selectedCardIDs,
                                selected: Game.room.selectedPlayers.map(e => e.seatID),
                            },
                        })
                    ,
                },
                cancel: {
                    visible: () => Game.getSkill(Game.room.askingSkillName).cancel,
                    enabled: () => true,
                    onClick: () => {
                        if (Game.room.originalAskingParam) {
                            let skillName: string = Game.room.askingSkillName;
                            if (skillName[0] == '$') {
                                let equipName = skillName.slice(1);
                                Game.room.selfPlayer.equipZoneCards.forEach(equip => {
                                    if (equip && equip.class.name == equipName)
                                        UI.self.gameArea.equipUI[equip.class.equipType].selected = false;
                                });
                            }
                            Game.room.selfPlayer.turnToUseSkill();
                        } else {
                            Game.room.selfPlayer.answerNo();
                        }
                    },
                },
                over: {
                    visible: () => false,
                },
            },
        });
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.SelectSuit,
            btnStatus: {
                ok: {
                    visible: () => false,
                },
                cancel: {
                    visible: () => false,
                },
                over: {
                    visible: () => false,
                },
                heart: {
                    visible: () => true,
                    enabled: () =>
                        Game.room.askingParam.suits.includes(Suit.Heart)
                    ,
                    onClick: () =>
                        Game.room.selfPlayer.answer(Suit.Heart)
                    ,
                },
                diamond: {
                    visible: () => true,
                    enabled: () =>
                        Game.room.askingParam.suits.includes(Suit.Diamond)
                    ,
                    onClick: () =>
                        Game.room.selfPlayer.answer(Suit.Diamond)
                    ,
                },
                spade: {
                    visible: () => true,
                    enabled: () =>
                        Game.room.askingParam.suits.includes(Suit.Spade)
                    ,
                    onClick: () =>
                        Game.room.selfPlayer.answer(Suit.Spade)
                    ,
                },
                club: {
                    visible: () => true,
                    enabled: () =>
                        Game.room.askingParam.suits.includes(Suit.Club)
                    ,
                    onClick: () =>
                        Game.room.selfPlayer.answer(Suit.Club)
                    ,
                },
            },
        });
    }
}