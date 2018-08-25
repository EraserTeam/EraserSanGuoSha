import AskingType from '../../AskingType';
import Card from '../../Card';
import CardType from '../../CardType';
import Country from '../../Country';
import Game from '../../Game';
import GameEvent, { GameSyncEvent } from '../../GameEvent';
import ISkill from '../../ISkill';
import Phase from '../../Phase';
import Player from '../../Player';
import Room from '../../Room';
import Sex from '../../Sex';
import SkillType from '../../SkillType';
export = () => {
    const pkg = Game.createPackage('wind');
    pkg.createSkill({
        name: 'CaoRenJuShou',
        tipName: '据守',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'CaoRenJuShou')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.PhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('CaoRenJuShou')) {
                    if (phase == Phase.Over) {
                        if (await player.askUseSkill('CaoRenJuShou')) {
                            await player.useSkill('CaoRenJuShou', async () => {
                                await player.drawCards(3);
                                await player.turnover();
                            });
                        }
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'CaoRen',
        tipName: '曹仁',
        country: Country.Wei,
        sex: Sex.Male,
        HP: 4,
        skills: ['CaoRenJuShou'],
    });

    pkg.createSkill({
        name: 'HuangZhongLieGong',
        tipName: '烈弓',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'HuangZhongLieGong')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.AfterSetTarget, async (card: Card, source: Player, selected: Player[], targets: Player[]) => {
                if (source.hasSkill('HuangZhongLieGong')) {
                    if (room.round.player == source && room.round.phase == Phase.Play) {
                        if (card.class.name == 'Sha') {
                            for (let target of targets) {
                                if (target.hand.length >= source.HP || target.hand.length <= source.attackRange) {
                                    if (await source.askUseSkill('HuangZhongLieGong')) {
                                        await source.useSkill('HuangZhongLieGong', async () => {
                                            target.setFlag('HuangZhongLieGongEffect', card.cardID);
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            });
            room.syncEvents.on(GameSyncEvent.CanAnswerCard, (player: Player, card: Card, by: string) => {
                if (by == 'Shan' && card.cardID == player.getFlag('HuangZhongLieGongEffect'))
                    return false;
            });
            room.events.on(GameEvent.AfterUseCardEnd, async (card: Card, player: Player) => {
                if (player.getFlag('HuangZhongLieGongEffect'))
                    player.setFlag('HuangZhongLieGongEffect', undefined);
            });
        },
    });
    pkg.createGeneral({
        name: 'HuangZhong',
        tipName: '黄忠',
        country: Country.Shu,
        sex: Sex.Male,
        HP: 4,
        skills: ['HuangZhongLieGong'],
    });

    pkg.createSkill({
        name: 'WeiYanKuangGu',
        tipName: '狂骨',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'WeiYanKuangGu')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.AfterDamage, async (source: Player, target: Player, n: number, sourceCard?: Card) => {
                if (source.hasSkill('WeiYanKuangGu')) {
                    if (source.wounded && source.distanceTo(target) == 1) {
                        if (await source.askUseSkill('WeiYanKuangGu')) {
                            await source.useSkill('WeiYanKuangGu', async () => {
                                await source.recover();
                            });
                        }
                    }
                    }
            });
        },
    });
    pkg.createGeneral({
        name: 'WeiYan',
        tipName: '魏延',
        country: Country.Shu,
        sex: Sex.Male,
        HP: 4,
        skills: ['WeiYanKuangGu'],
    });

    pkg.createSkill({
        name: 'XiaHouYuanShenSu',
        tipName: '神速',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'XiaHouYuanShenSu')
        ,
        minCardCount: 0,
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] => {
            let phase: Phase = player.room.askingParam.phase;
            if (phase == Phase.Judge) {
                return [];
            } else {
                return cards.filter(card => card.class.type == CardType.Equip);
            }
        },
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1 + player.extraMaxTargetCount(player.room.makeVirtualCard('Sha')))
                return [];
            else
                return targets.filter(e => e != player);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) => {
            if (selected.length == 0)
                return false;
            let phase: Phase = player.room.askingParam.phase;
            if (phase == Phase.Judge) {
                return true;
            } else {
                return cards.length == 1;
            }
        },
        init: (room: Room) => {
            room.events.on(GameEvent.BeforePhaseBegin, async (player: Player, phase: Phase) => {
                if (player.hasSkill('XiaHouYuanShenSu')) {
                    if (phase == Phase.Judge) {
                        let skillParam = await player.askUseSkill('XiaHouYuanShenSu', { phase });
                        if (skillParam) {
                            let selected: Player[] = skillParam.selected;
                            await player.useSkill('XiaHouYuanShenSu', async () => {
                                await player.room.round.skipPhase(Phase.Judge);
                                await player.room.round.skipPhase(Phase.Draw);
                                await player.useCard(player.room.makeVirtualCard('Sha'), selected, selected);
                            }, selected);
                        }
                    } else if (phase == Phase.Play) {
                        let skillParam = await player.askUseSkill('XiaHouYuanShenSu', { phase });
                        if (skillParam) {
                            let selected: Player[] = skillParam.selected;
                            await player.useSkill('XiaHouYuanShenSu', async () => {
                                if (phase == Phase.Play) {
                                    let cards: Card[] = skillParam.cards;
                                    await player.discard(cards);
                                }
                                await player.useCard(player.room.makeVirtualCard('Sha'), selected, selected);
                                await player.room.round.skipPhase(Phase.Play);
                            }, selected);
                        }
                    }
                }
            });
        },
    });
    pkg.createGeneral({
        name: 'XiaHouYuan',
        tipName: '夏侯渊',
        country: Country.Wei,
        sex: Sex.Male,
        HP: 4,
        skills: ['XiaHouYuanShenSu'],
    });
};
