import AskingType from '../../AskingType';
import Card from '../../Card';
import CardType from '../../CardType';
import Color from '../../Color';
import Country from '../../Country';
import Game from '../../Game';
import GameEvent, { GameSyncEvent } from '../../GameEvent';
import IMoveCardInfo from '../../IMoveCardInfo';
import ISkill from '../../ISkill';
import Phase from '../../Phase';
import Player from '../../Player';
import RequireType from '../../RequireType';
import Room from '../../Room';
import Sex from '../../Sex';
import SkillType from '../../SkillType';
import Suit from '../../Suit';
import Zone from '../../Zone';
export = () => {
    const pkg = Game.createPackage('std/general');
    pkg.createSkill({
        name: 'HuangGaiKuRou',
        tipName: '苦肉',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard)
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            await player.loseHP();
            if (player.alive)
                await player.drawCards(2);
        },
    });
    pkg.createGeneral({
        name: 'HuangGai',
        tipName: '黄盖',
        country: Country.Wu,
        sex: Sex.Male,
        HP: 4,
        skills: ['HuangGaiKuRou'],
    });

    pkg.createSkill({
        name: 'ZhangFeiPaoXiao',
        tipName: '咆哮',
        type: SkillType.Lock,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.LimitUseCount, (player: Player, card: Card) => {
                if (player.hasSkill('ZhangFeiPaoXiao')) {
                    if (card.class.name == 'Sha') {
                        player.syncUseSkill('ZhangFeiPaoXiao');
                        return false;
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'ZhangFei',
        tipName: '张飞',
        country: Country.Shu,
        sex: Sex.Male,
        HP: 4,
        skills: ['ZhangFeiPaoXiao'],
    });

    pkg.createSkill({
        name: 'ZhenJiLuoShen',
        tipName: '洛神',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'ZhenJiLuoShen')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('ZhenJiLuoShen')) {
                    if (phase == Phase.Prepare) {
                        let color;
                        do {
                            if (!await player.askUseSkill('ZhenJiLuoShen'))
                                break;
                            await player.useSkill('ZhenJiLuoShen', async () => {
                                let result = await player.judge(async (card: Card) => {
                                    if (card.color == Color.Black)
                                        await player.getCards([card]);
                                });
                                color = Game.getColor(result.suit);
                            });
                        } while (color == Color.Black);
                    }
                }
            });
        },
    });
    pkg.createSkill({
        name: 'ZhenJiQingGuo',
        tipName: '倾国',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) && (
                player.room.askingMatch(AskingType.UseCard) ||
                player.room.askingMatch(AskingType.RespondCard)
            ) && player.room.askingParam.cardClassName == 'Shan'
        ,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
            cards.filter(card => card.inHand && card.color == Color.Black)
        ,
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) =>
            player.room.makeVirtualCard('Shan', cards)
        ,
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'Shan');
        },
    });
    pkg.createGeneral({
        name: 'ZhenJi',
        tipName: '甄姬',
        country: Country.Wei,
        sex: Sex.Female,
        HP: 3,
        skills: ['ZhenJiLuoShen', 'ZhenJiQingGuo'],
    });

    pkg.createSkill({
        name: 'HuaTuoJiJiu',
        tipName: '急救',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.round.player != player &&
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseCard) &&
            player.room.askingParam.cardClassName == 'Tao'
        ,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
            cards.filter(card => card.color == Color.Red)
        ,
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) =>
            player.room.makeVirtualCard('Tao', cards)
        ,
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'Tao');
        },
    });
    pkg.createSkill({
        name: 'HuaTuoQingNang',
        tipName: '青囊',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard) &&
            player.getFlag('useHuaTuoQingNangCount') < 1
        ,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] => cards.filter(card => card.inHand),
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1)
                return [];
            else
                return targets.filter(e => e.wounded);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 1
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let cards: Card[] = skillParam.cards;
            let target: Player = skillParam.selected[0];
            let cnt = player.getFlag('useHuaTuoQingNangCount');
            player.setFlag('useHuaTuoQingNangCount', cnt + 1);
            await player.discard(cards);
            await target.recover({ source: player });
        },
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('HuaTuoQingNang')) {
                    if (phase == Phase.Play) {
                        player.setFlag('useHuaTuoQingNangCount', 0);
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'HuaTuo',
        tipName: '华佗',
        country: Country.Qun,
        sex: Sex.Male,
        HP: 3,
        skills: ['HuaTuoJiJiu', 'HuaTuoQingNang'],
    });

    pkg.createSkill({
        name: 'GanNingQiXi',
        tipName: '奇袭',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) && (
                player.room.askingMatch(AskingType.PlayCard) &&
                player.cardEnabled(player.room.makeVirtualCard('GuoHeChaiQiao')) || (
                    player.room.askingMatch(AskingType.UseCard) &&
                    player.room.askingParam.cardClassName == 'GuoHeChaiQiao'
                )
            )
        ,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
            cards.filter(card => card.color == Color.Black)
        ,
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) =>
            player.room.makeVirtualCard('GuoHeChaiQiao', cards)
        ,
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'GuoHeChaiQiao');
        },
    });
    pkg.createGeneral({
        name: 'GanNing',
        tipName: '甘宁',
        country: Country.Wu,
        sex: Sex.Male,
        HP: 4,
        skills: ['GanNingQiXi'],
    });

    pkg.createSkill({
        name: 'GuanYuWuSheng',
        tipName: '武圣',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) && (
                player.room.askingMatch(AskingType.PlayCard) &&
                player.cardEnabled(player.room.makeVirtualCard('Sha')) || (
                    (
                        player.room.askingMatch(AskingType.UseCard) ||
                        player.room.askingMatch(AskingType.RespondCard)
                    ) &&
                    player.room.askingParam.cardClassName == 'Sha'
                )
            )
        ,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
            cards.filter(card => card.color == Color.Red)
        ,
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) =>
            player.room.makeVirtualCard('Sha', cards)
        ,
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'Sha');
        },
    });
    pkg.createGeneral({
        name: 'GuanYu',
        tipName: '关羽',
        country: Country.Shu,
        sex: Sex.Male,
        HP: 4,
        skills: ['GuanYuWuSheng'],
    });

    pkg.createSkill({
        name: 'LvMengKeJi',
        tipName: '克己',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'LvMengKeJi')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.BeforePhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('LvMengKeJi')) {
                    if (phase == Phase.Discard) {
                        if (player.getFlag('useShaCount') < 1) {
                            if (await player.askUseSkill('LvMengKeJi')) {
                                await player.useSkill('LvMengKeJi', async () => {
                                    await room.round.skipPhase(Phase.Discard);
                                });
                            }
                        }
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'LvMeng',
        tipName: '吕蒙',
        country: Country.Wu,
        sex: Sex.Male,
        HP: 4,
        skills: ['LvMengKeJi'],
    });

    pkg.createSkill({
        name: '*XiaHouDunGangLie_target',
        type: SkillType.Normal,
        minCardCount: 2,
        maxCardCount: 2,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
            cards.filter(card => card.inHand)
        ,
    });
    pkg.createSkill({
        name: 'XiaHouDunGangLie',
        tipName: '刚烈',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'XiaHouDunGangLie')
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let cards: Card[] = skillParam.cards;
            let target: Player = skillParam.selected[0];
            let cnt = player.getFlag('LiuBeiRenDeCardCount');
            let newCnt = cnt + cards.length;
            player.setFlag('LiuBeiRenDeCardCount', newCnt);
            await target.getCards(cards);
            if (cnt < 2 && newCnt >= 2) {
                await player.recover();
            }
        },
        init: (room: Room) => {
            room.events.on(GameEvent.AfterDamaged, async (player: Player, source: Player | true, n: number, sourceCard?: Card) => {
                if (player.hasSkill('XiaHouDunGangLie')) {
                    if (await player.askUseSkill('XiaHouDunGangLie', { source })) {
                        await player.useSkill('XiaHouDunGangLie', async () => {
                            let result = await player.judge();
                            if (result.suit != Suit.Heart) {
                                if (source instanceof Player) {
                                    let response = await source.askUseSkill('*XiaHouDunGangLie_target', { player });
                                    if (response) {
                                        await source.discard(response.cards);
                                    } else {
                                        await source.damaged(player);
                                    }
                                }
                            }
                        }, source instanceof Player ? [source] : []);
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'XiaHouDun',
        tipName: '夏侯惇',
        country: Country.Wei,
        sex: Sex.Male,
        HP: 4,
        skills: ['XiaHouDunGangLie'],
    });

    pkg.createSkill({
        name: 'MaChaoMaShu',
        tipName: '马术',
        type: SkillType.Lock,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.CalcDistance, (fromPlayer: Player, toPlayer: Player, distance: number) => {
                if (fromPlayer.hasSkill('MaChaoMaShu')) {
                    return distance - 1;
                }
            });
        },
    });
    pkg.createSkill({
        name: 'MaChaoTieQi',
        tipName: '铁骑',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'MaChaoTieQi')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.AfterSetTarget, async (card: Card, source: Player, selected: Player[], targets: Player[]) => {
                if (source.hasSkill('MaChaoTieQi')) {
                    if (card.class.name == 'Sha') {
                        for (let target of targets) {
                            if (await source.askUseSkill('MaChaoTieQi', { target })) {
                                await source.useSkill('MaChaoTieQi', async () => {
                                    let result = await source.judge();
                                    let color = Game.getColor(result.suit);
                                    if (color == Color.Red)
                                        target.setFlag('MaChaoTieQiEffect', card.cardID);
                                });
                            }
                        }
                    }
                }
            });
            room.syncEvents.on(GameSyncEvent.CanAnswerCard, (player: Player, card: Card, by: string) => {
                if (by == 'Shan' && card.cardID == player.getFlag('MaChaoTieQiEffect'))
                    return false;
            });
            room.events.on(GameEvent.AfterUseCardEnd, async (card: Card, player: Player) => {
                if (player.getFlag('MaChaoTieQiEffect'))
                    player.setFlag('MaChaoTieQiEffect', undefined);
            });
        },
    });
    pkg.createGeneral({
        name: 'MaChao',
        tipName: '马超',
        country: Country.Shu,
        sex: Sex.Male,
        HP: 4,
        skills: ['MaChaoMaShu', 'MaChaoTieQi'],
    });

    pkg.createSkill({
        name: 'ZhaoYunLongDan',
        tipName: '龙胆',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) && (
                player.room.askingMatch(AskingType.PlayCard) &&
                player.cardEnabled(player.room.makeVirtualCard('Sha')) || (
                    (
                        player.room.askingMatch(AskingType.UseCard) ||
                        player.room.askingMatch(AskingType.RespondCard)
                    ) && (
                        player.room.askingParam.cardClassName == 'Sha' ||
                        player.room.askingParam.cardClassName == 'Shan'
                    )
                )
            )
        ,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] => {
            if (player.room.askPlayers.includes(player) && player.room.askingType == AskingType.PlayCard || player.room.askingParam.cardClassName == 'Sha') {
                return cards.filter(card => card.class.name == 'Shan');
            } else {
                return cards.filter(card => card.class.name == 'Sha');
            }
        },
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) => {
            if (cards[0].class.name == 'Sha') {
                return player.room.makeVirtualCard('Shan', cards);
            } else if (cards[0].class.name == 'Shan') {
                return player.room.makeVirtualCard('Sha', cards);
            } else {
                return undefined as any;
            }
        },
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'Sha');
            room.require(RequireType.CardClass, 'Shan');
        },
    });
    pkg.createGeneral({
        name: 'ZhaoYun',
        tipName: '赵云',
        country: Country.Shu,
        sex: Sex.Male,
        HP: 4,
        skills: ['ZhaoYunLongDan'],
    });

    pkg.createSkill({
        name: 'ZhouYuYingZi',
        tipName: '英姿',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'ZhouYuYingZi')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.CalcDrawPhaseCardCount, async (player: Player, n: number) => {
                if (player.hasSkill('ZhouYuYingZi')) {
                    if (await player.askUseSkill('ZhouYuYingZi')) {
                        await player.useSkill('ZhouYuYingZi', true);
                        return n + 1;
                    }
                }
            });
        },
    });
    pkg.createAsking({
        name: 'ZhouYuFanJian',
    });
    pkg.createSkill({
        name: 'ZhouYuFanJian',
        tipName: '反间',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard) &&
            player.getFlag('useZhouYuFanJianCount') < 1 &&
            player.hand.length > 0
        ,
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1)
                return [];
            else
                return targets.filter(e => e != player);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 1
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let target: Player = skillParam.selected[0];
            let cnt = player.getFlag('useZhouYuFanJianCount');
            player.setFlag('useZhouYuFanJianCount', cnt + 1);
            await target.recover({ source: player });
            let suit = await target.askSelectSuit(
                'ZhouYuFanJian',
                {
                    extra: {
                        target: target.seatID,
                    },
                },
            );
            let random = player.room.random(0, player.hand.length - 1);
            let card = player.hand[random];
            await target.getCards([card]);
            // TODO:获得此牌的角色应当展示之
            if (card.suit != suit) {
                await player.damage(target);
            }
        },
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('ZhouYuFanJian')) {
                    if (phase == Phase.Play) {
                        player.setFlag('useZhouYuFanJianCount', 0);
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'ZhouYu',
        tipName: '周瑜',
        country: Country.Wu,
        sex: Sex.Male,
        HP: 3,
        skills: ['ZhouYuYingZi', 'ZhouYuFanJian'],
    });

    pkg.createSkill({
        name: 'LiuBeiRenDe',
        tipName: '仁德',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard)
        ,
        maxCardCount: Infinity,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] => cards.filter(card => card.inHand),
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1)
                return [];
            else
                return targets.filter(e => e != player);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 1
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let cards: Card[] = skillParam.cards;
            let target: Player = skillParam.selected[0];
            let cnt = player.getFlag('LiuBeiRenDeCardCount');
            let newCnt = cnt + cards.length;
            player.setFlag('LiuBeiRenDeCardCount', newCnt);
            await target.getCards(cards);
            if (cnt < 2 && newCnt >= 2) {
                await player.recover();
            }
        },
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('LiuBeiRenDe')) {
                    if (phase == Phase.Play) {
                        player.setFlag('LiuBeiRenDeCardCount', 0);
                    }
                }
            });
        },
    });
    pkg.createAsking({
        name: 'LiuBeiJiJiang',
        param: {
            cardClassName: 'Sha',
        },
    });
    pkg.createSkill({
        name: 'LiuBeiJiJiang',
        tipName: '激将',
        emperor: true,
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) && (
                player.room.askingMatch(AskingType.PlayCard) &&
                player.cardEnabled(player.room.makeVirtualCard('Sha')) || (
                    (
                        player.room.askingMatch(AskingType.UseCard) ||
                        player.room.askingMatch(AskingType.RespondCard)
                    ) && player.room.askingParam.cardClassName == 'Sha'
                )
            )
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let players = player.room.alivePlayers;
            players = Game.sortPlayersBySeatNum(players, player.room.round.player);
            players = players.filter(e => e != player && e.country == Country.Shu);
            for (let currentPlayer of players) {
                let card = await currentPlayer.askRespondCard(
                    'LiuBeiJiJiang',
                    {
                        extra: {
                            source: player.seatID,
                        },
                    },
                );
                if (card) {
                    skillParam.card = card;
                    break;
                }
            }
        },
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) => {
            return skillParam.card;
        },
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'Sha');
        },
    });
    pkg.createGeneral({
        name: 'LiuBei',
        tipName: '刘备',
        country: Country.Shu,
        sex: Sex.Male,
        HP: 4,
        skills: ['LiuBeiRenDe', 'LiuBeiJiJiang'],
    });

    pkg.createSkill({
        name: 'SunQuanZhiHeng',
        tipName: '制衡',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard) &&
            player.getFlag('useSunQuanZhiHengCount') < 1
        ,
        maxCardCount: Infinity,
        filterCard: true,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let cards: Card[] = skillParam.cards;
            let cnt = player.getFlag('useSunQuanZhiHengCount');
            player.setFlag('useSunQuanZhiHengCount', cnt + 1);
            await player.discard(cards);
            await player.drawCards(cards.length);
        },
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('SunQuanZhiHeng')) {
                    if (phase == Phase.Play) {
                        player.setFlag('useSunQuanZhiHengCount', 0);
                    }
                }
            });
        },
    });
    pkg.createSkill({
        name: 'SunQuanJiuYuan',
        tipName: '救援',
        emperor: true,
        type: SkillType.Lock,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.CalcRecoverNumber, (player: Player, source: Player, n: number, sourceCard: Card) => {
                if (player.hasSkill('SunQuanJiuYuan')) {
                    if (player.dying && source != player && source.country == Country.Wu && sourceCard.class.name == 'Tao') {
                        player.syncUseSkill('SunQuanJiuYuan');
                        return n + 1;
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'SunQuan',
        tipName: '孙权',
        country: Country.Wu,
        sex: Sex.Male,
        HP: 4,
        skills: ['SunQuanZhiHeng', 'SunQuanJiuYuan'],
    });

    pkg.createSkill({
        name: 'CaoCaoJianXiong',
        tipName: '奸雄',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'CaoCaoJianXiong')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.AfterDamaged, async (player: Player, source: Player | true, n: number, sourceCard?: Card) => {
                if (player.hasSkill('CaoCaoJianXiong')) {
                    if (sourceCard) {
                        if (await player.askUseSkill('CaoCaoJianXiong')) {
                            await player.useSkill('CaoCaoJianXiong', async () => {
                                await player.getCards([sourceCard]);
                            });
                        }
                    }
                }
            });
        },
    });
    pkg.createAsking({
        name: 'CaoCaoHuJia',
        param: {
            cardClassName: 'Shan',
        },
    });
    pkg.createSkill({
        name: 'CaoCaoHuJia',
        tipName: '护驾',
        emperor: true,
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) && (
                (
                    player.room.askingMatch(AskingType.UseCard) ||
                    player.room.askingMatch(AskingType.RespondCard)
                ) && player.room.askingParam.cardClassName == 'Shan'
            )
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let players = player.room.alivePlayers;
            players = Game.sortPlayersBySeatNum(players, player.room.round.player);
            players = players.filter(e => e != player && e.country == Country.Wei);
            for (let currentPlayer of players) {
                let card = await currentPlayer.askRespondCard(
                    'CaoCaoHuJia',
                    {
                        extra: {
                            source: player.seatID,
                        },
                    },
                );
                if (card) {
                    skillParam.card = card;
                    break;
                }
            }
        },
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) => {
            return skillParam.card;
        },
    });
    pkg.createGeneral({
        name: 'CaoCao',
        tipName: '曹操',
        country: Country.Wei,
        sex: Sex.Male,
        HP: 4,
        skills: ['CaoCaoJianXiong', 'CaoCaoHuJia'],
    });

    pkg.createSkill({
        name: 'DaQiaoGuoSe',
        tipName: '国色',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) && (
                player.room.askingMatch(AskingType.PlayCard) &&
                player.cardEnabled(player.room.makeVirtualCard('LeBuSiShu')) || (
                    player.room.askingMatch(AskingType.UseCard) &&
                    player.room.askingParam.cardClassName == 'LeBuSiShu'
                )
            )
        ,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
            cards.filter(card => card.suit == Suit.Diamond)
        ,
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) =>
            player.room.makeVirtualCard('LeBuSiShu', cards)
        ,
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'LeBuSiShu');
        },
    });
    pkg.createSkill({
        name: 'DaQiaoLiuLi',
        tipName: '流离',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'DaQiaoLiuLi')
        ,
        maxCardCount: 1,
        filterCard: true,
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1)
                return [];
            else {
                let source = player.room.players[player.room.askingParam.source];
                return targets.filter(e => e != player && e.inAttackRange(player) && e != source);
            }
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 1
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.SetTarget, async (card: Card, source: Player, selected: Player[], targets: Player[], flag: any) => {
                if (card.class.name == 'Sha') {
                    for (let [i, target] of Object.entries(targets)) {
                        if (target.hasSkill('DaQiaoLiuLi')) {
                            let players = target.room.alivePlayers;
                            players = players.filter(e => e != target && e.inAttackRange(target) && e != source);
                            if (players.length == 0)
                                continue;
                            let skillParam = await target.askUseSkill('DaQiaoLiuLi', { source });
                            if (skillParam) {
                                await target.useSkill('DaQiaoLiuLi', async () => {
                                    targets[+i] = skillParam.selected[0];
                                }, skillParam.selected);
                            }
                        }
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'DaQiao',
        tipName: '大乔',
        country: Country.Wu,
        sex: Sex.Female,
        HP: 3,
        skills: ['DaQiaoGuoSe', 'DaQiaoLiuLi'],
    });

    pkg.createSkill({
        name: 'SunShangXiangJieYin',
        tipName: '结姻',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard) &&
            player.getFlag('useSunShangXiangJieYinCount') < 1
        ,
        minCardCount: 2,
        maxCardCount: 2,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] => cards.filter(card => card.inHand),
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1)
                return [];
            else
                return targets.filter(e => e.wounded && e.sex == Sex.Male);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 1
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let cards: Card[] = skillParam.cards;
            let target: Player = skillParam.selected[0];
            let cnt = player.getFlag('useSunShangXiangJieYinCount');
            player.setFlag('useSunShangXiangJieYinCount', cnt + 1);
            await player.discard(cards);
            await player.recover();
            await target.recover({ source: player });
        },
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('SunShangXiangJieYin')) {
                    if (phase == Phase.Play) {
                        player.setFlag('useSunShangXiangJieYinCount', 0);
                    }
                }
            });
        },
    });
    pkg.createSkill({
        name: 'SunShangXiangXiaoJi',
        tipName: '枭姬',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'SunShangXiangXiaoJi')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.AfterMoveCard, async (info: IMoveCardInfo[]) => {
                let skillPlayers = room.alivePlayers.filter(e => e.hasSkill('SunShangXiangXiaoJi'));
                skillPlayers = Game.sortPlayersBySeatNum(skillPlayers, room.round.player);
                for (let player of skillPlayers) {
                    let cards = info.filter(e => e.fromPlayer == player && e.fromZone == Zone.Equip).map(e => e.card);
                    for (let card of cards) {
                        if (await player.askUseSkill('SunShangXiangXiaoJi')) {
                            await player.useSkill('SunShangXiangXiaoJi', async () => {
                                await player.drawCards(2);
                            });
                        }
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'SunShangXiang',
        tipName: '孙尚香',
        country: Country.Wu,
        sex: Sex.Female,
        HP: 3,
        skills: ['SunShangXiangJieYin', 'SunShangXiangXiaoJi'],
    });

    pkg.createSkill({
        name: 'DiaoChanLiJian',
        tipName: '离间',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard) &&
            player.getFlag('useDiaoChanLiJianCount') < 1
        ,
        maxCardCount: 1,
        filterCard: true,
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 2)
                return [];
            else
                return targets.filter(e => e.sex == Sex.Male);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 2
        ,
        effect: async (skill: ISkill, player: Player, skillParam: any) => {
            let cards: Card[] = skillParam.cards;
            let [target, source]: Player[] = skillParam.selected;
            let cnt = player.getFlag('useDiaoChanLiJianCount');
            player.setFlag('useDiaoChanLiJianCount', cnt + 1);
            await player.discard(cards);
            await source.useCard(player.room.makeVirtualCard('JueDou'), [target], [target]);
        },
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('DiaoChanLiJian')) {
                    if (phase == Phase.Play) {
                        player.setFlag('useDiaoChanLiJianCount', 0);
                    }
                }
            });
        },
    });
    pkg.createSkill({
        name: 'DiaoChanBiYue',
        tipName: '闭月',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'DiaoChanBiYue')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('DiaoChanBiYue')) {
                    if (phase == Phase.Over) {
                        if (await player.askUseSkill('DiaoChanBiYue')) {
                            await player.useSkill('DiaoChanBiYue', async () => {
                                await player.drawCards(1);
                            });
                        }
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'DiaoChan',
        tipName: '貂蝉',
        country: Country.Qun,
        sex: Sex.Female,
        HP: 3,
        skills: ['DiaoChanLiJian', 'DiaoChanBiYue'],
    });

    pkg.createSkill({
        name: 'ZhangLiaoTuXi',
        tipName: '突袭',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'ZhangLiaoTuXi')
        ,
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 2)
                return [];
            else
                return targets.filter(e => e != player && e.hand.length);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length > 0
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('ZhangLiaoTuXi')) {
                    if (phase == Phase.Draw) {
                        let skillParam = await player.askUseSkill('ZhangLiaoTuXi');
                        if (skillParam) {
                            let selected: Player[] = skillParam.selected;
                            await player.useSkill('ZhangLiaoTuXi', async () => {
                                room.round.giveUpDrawCards = true;
                                for (let target of selected) {
                                    if (!target.hand.length)
                                        continue;
                                    let card = target.hand[player.room.random(0, target.hand.length - 1)];
                                    await player.getCards([card]);
                                }
                            }, selected);
                        }
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'ZhangLiao',
        tipName: '张辽',
        country: Country.Wei,
        sex: Sex.Male,
        HP: 4,
        skills: ['ZhangLiaoTuXi'],
    });

    pkg.createSkill({
        name: 'XuChuLuoYi',
        tipName: '裸衣',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'XuChuLuoYi')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.BeforePhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('XuChuLuoYi')) {
                    if (phase == Phase.Draw) {
                        if (await player.askUseSkill('XuChuLuoYi')) {
                            await player.useSkill('XuChuLuoYi', async () => {
                                player.setFlag('XuChuLuoYiEffect', true);
                            });
                        }
                    }
                }
            });
            room.events.on(GameEvent.CalcDrawPhaseCardCount, async (player: Player, n: number) => {
                if (player.getFlag('XuChuLuoYiEffect')) {
                    return n - 1;
                }
            });
            room.events.on(GameEvent.Damage, async (source: Player, target: Player, n: number, sourceCard?: Card) => {
                if (source.getFlag('XuChuLuoYiEffect')) {
                    return n + 1;
                }
            });
            room.events.on(GameEvent.AfterRoundEnd, async (player: Player) => {
                if (player.getFlag('XuChuLuoYiEffect')) {
                    return player.setFlag('XuChuLuoYiEffect', false);
                }
            }, Infinity);
        },
    });
    pkg.createGeneral({
        name: 'XuChu',
        tipName: '许褚',
        country: Country.Wei,
        sex: Sex.Male,
        HP: 4,
        skills: ['XuChuLuoYi'],
    });

    pkg.createSkill({
        name: 'HuangYueYingJiZhi',
        tipName: '集智',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'HuangYueYingJiZhi')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.UseCard, async (card: Card, player: Player) => {
                if (player.hasSkill('HuangYueYingJiZhi')) {
                    if (card.class.type == CardType.Bag && !card.class.delay) {
                        if (await player.askUseSkill('HuangYueYingJiZhi')) {
                            await player.useSkill('HuangYueYingJiZhi', async () => {
                                await player.drawCards(1);
                            });
                        }
                    }
                }
            });
        },
    });
    pkg.createSkill({
        name: 'HuangYueYingQiCai',
        tipName: '奇才',
        type: SkillType.Lock,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.LimitUseCount, (player: Player, card: Card) => {
                if (player.hasSkill('HuangYueYingQiCai')) {
                    if (card.class.type == CardType.Bag) {
                        player.syncUseSkill('HuangYueYingQiCai');
                        return false;
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'HuangYueYing',
        tipName: '黄月英',
        country: Country.Shu,
        sex: Sex.Female,
        HP: 3,
        skills: ['HuangYueYingJiZhi', 'HuangYueYingQiCai'],
    });
};
