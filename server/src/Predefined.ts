import AskingType from './AskingType';
import Card from './Card';
import CardType from './CardType';
import EquipType from './EquipType';
import Game from './Game';
import GameEvent from './GameEvent';
import { GameSyncEvent } from './GameEvent';
import Package from './Package';
import Player from './Player';
import Room from './Room';
import SkillType from './SkillType';
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
                filterSelect: false,
                filterTarget: (card: Card, player: Player, targets: Player[]): Player[] => {
                    return [player];
                },
                init: (room: Room) => {
                    room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                        if (skillName == (isPlusHorse ? '$PlusHorse' : '$MinusHorse')) {
                            return player.hasEquip(name);
                        }

                    });
                },
            });
        });
    }
    private static initAskingTypeContents() {
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.Discard,
            minCardCount: (player: Player) => player.room.askingParam.minCount,
            maxCardCount: (player: Player) => player.room.askingParam.maxCount,
            filterCard: (player: Player, selectedCards: Card[], cards: Card[]): Card[] => cards.filter(card => card.inHand),
        });
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.PlayCard,
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
        });
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.RespondCard,
            maxCardCount: 1,
        });
        Predefined.pkg.createAskingTypeContent({
            askingType: AskingType.UseCard,
            maxCardCount: 1,
        });
    }
    public static initEvents(room: Room) {
        {
            /* 
                A无视B的防具，即在A使用牌对B进行结算的过程中，或在A使用技能的结算过程中，或在B
                受到来源为A的伤害的结算过程中，B的防具无效，但是在上述这些过程中插入的除A外的角
                色使用牌的结算过程中，或除A外的角色使用技能的结算过程中，或B受到来源不为A的伤害
                的结算过程中，B的防具有效。
            */
            let listeners: Array<(player: Player) => boolean> = [];
            room.events.on(GameEvent.$BeforeCallCardEffect, async (card: Card, source: Player | undefined, selected: Player[], targets: Player[], target?: Player) => {
                if (source && target && source.ignoreArmor(target)) {
                    let oldListeners = [...listeners];
                    let listener = (player: Player) => player == target && source.ignoreArmor(target);
                    listeners.push(listener);
                    room.syncEvents.on(GameSyncEvent.ArmorInvalid, listener, -1);
                    return async () => {
                        room.syncEvents.removeListener(GameSyncEvent.ArmorInvalid, listener);
                        listeners = oldListeners;
                    };
                }
            }, Infinity);
            room.events.on(GameEvent.$BeforeCallUseSkill, async (player: Player, skillName: string, skillParam: any) => {
                let oldListeners = [...listeners];
                let newListeners: Array<(player: Player) => boolean> = [];
                room.alivePlayers.forEach(target => {
                    if (player.ignoreArmor(target)) {
                        let listener = (p: Player) => p == target && player.ignoreArmor(target);
                        newListeners.push(listener);
                        listeners.push(listener);
                        room.syncEvents.on(GameSyncEvent.ArmorInvalid, listener, -1);
                    }
                });
                return async () => {
                    newListeners.forEach(listener => {
                        room.syncEvents.removeListener(GameSyncEvent.ArmorInvalid, listener);
                    });
                    listeners = oldListeners;
                };
            }, Infinity);
            room.events.on(GameEvent.$BeforeCallDamaged, async (source: Player | true, target: Player, n: number, sourceCard?: Card) => {
                if (source instanceof Player && source.ignoreArmor(target)) {
                    let oldListeners = [...listeners];
                    let listener = (player: Player) => player == target && source.ignoreArmor(target);
                    listeners.push(listener);
                    room.syncEvents.on(GameSyncEvent.ArmorInvalid, listener, -1);
                    return async () => {
                        room.syncEvents.removeListener(GameSyncEvent.ArmorInvalid, listener);
                        listeners = oldListeners;
                    };
                }
            }, Infinity);
        }
    }
}
export default Predefined;
