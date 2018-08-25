import AskingType from '../../AskingType';
import Card from '../../Card';
import Game from '../../Game';
import Player from '../../Player';
import CardType from './../../CardType';
import Color from './../../Color';
import EquipType from './../../EquipType';
import { GameSyncEvent } from './../../GameEvent';
import GameEvent from './../../GameEvent';
import Phase from './../../Phase';
import Room from './../../Room';
import SkillType from './../../SkillType';
import Suit from './../../Suit';
import * as Util from './../../Util';
import Zone from './../../Zone';
export = () => {
    const pkg = Game.createPackage('ex');
    pkg.createSkill({
        name: '$RenWangDun',
        type: SkillType.Lock,
        init: (room: Room) => {
            room.events.on(GameEvent.BeforeCardEffect, async (card: Card, source: Player, selected: Player[], targets: Player[], target: Player) => {
                if (target && await target.hasSkill('$RenWangDun')) {
                    if (card.class.name == 'Sha' && card.color == Color.Black) {
                        await target.useSkill('$RenWangDun');
                        return false;
                    }
                }
                return true;
            });
        },
    });
    pkg.createCardClass({
        name: 'RenWangDun',
        tipName: '仁王盾',
        type: CardType.Equip,
        equipType: EquipType.Armor,
        enabled: true,
        filterTarget: (card: Card, player: Player, targets: Player[]): Player[] => [player],
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$RenWangDun') {
                    return player.hasEquip('RenWangDun');
                }
            });
        },
    });
    pkg.createAsking({
        name: 'HanBingJian',
        param: {
            cardCount: 1,
        },
    });
    pkg.createSkill({
        name: '$HanBingJian',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, '$HanBingJian')
        ,
        init: (room: Room) => {
            room.events.on(GameEvent.Damage, async (player: Player, target: Player, n: number, sourceCard?: Card) => {
                if (player.hasSkill('$HanBingJian')) {
                    if (sourceCard && sourceCard.class.name == 'Sha' && target.hasCard) {
                        if (await player.askUseSkill('$HanBingJian', { target })) {
                            await player.useSkill('$HanBingJian');
                            for (let i = 0; i < 2; i++) {
                                if (!target.hasCard)
                                    continue;
                                let cards = await player.askSelectCardsInWindow(
                                    'HanBingJian',
                                    {
                                        cards: [...room.makeUnknownCards(target.hand.length), ...target.equipZoneCards],
                                        extra: {
                                            target: target.seatID,
                                        },
                                    },
                                );
                                cards = cards.map(card => {
                                    if (card == target.room.unknownCard) {
                                        let random = room.random(0, target.hand.length - 1);
                                        return target.hand[random];
                                    } else {
                                        return card;
                                    }
                                });
                                await player.discard(cards);
                            }
                            return 0;
                        }
                    }
                }
            });
        },
    });
    pkg.createCardClass({
        name: 'HanBingJian',
        tipName: '寒冰剑',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 2,
        enabled: true,
        filterTarget: (card: Card, player: Player, targets: Player[]): Player[] => [player],
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$HanBingJian')
                    return player.hasEquip('HanBingJian');
            });
        },
    });
};
