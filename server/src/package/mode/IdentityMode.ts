import Game from '../../Game';
import GameEarlierEvent from '../../GameEarlierEvent';
import GameEvent from '../../GameEvent';
import Identity from '../../Identity';
import Player from '../../Player';
import RequireType from '../../RequireType';
import Room from '../../Room';
import * as Util from '../../Util';
const getIdentityCounts = (room: Room) => {
    /*
        2P 1主1反
        3P 1主1反1内
        4P 1主1忠1反1内
        5P 1主1忠2反1内
        6P 1主1忠3反1内
        7P 1主2忠3反1内
        8P 1主2忠4反1内
    */
    let identityCounts = {
        [Identity.ZhongChen]: 1,
        [Identity.FanZei]: 1,
        [Identity.NeiJian]: 1,
    };
    if (room.players.length <= 3) {
        identityCounts[Identity.ZhongChen]--;
    } else if (room.players.length >= 7) {
        identityCounts[Identity.ZhongChen]++;
    }
    if (room.players.length >= 5) {
        identityCounts[Identity.FanZei]++;
    }
    if (room.players.length >= 6) {
        identityCounts[Identity.FanZei]++;
    }
    if (room.players.length >= 8) {
        identityCounts[Identity.FanZei]++;
    }
    if (room.players.length <= 2) {
        identityCounts[Identity.NeiJian]--;
    }
    return identityCounts;
};
export = () => {
    Game.createMode({
        name: 'IdentityMode',
        abstract: true,
        init: (room: Room) => {
            room.require(RequireType.Mode, 'AbstractIdentityMode');
            room.identitiesGuess = [Identity.FanZei, Identity.ZhongChen, Identity.NeiJian];
            room.earlierEvents.on(GameEarlierEvent.DealIdentities, async (players: Player[]) => {
                let [first, ...rest] = players;
                first.identity = Identity.ZhuGong;
                first.showIdentity();
                let identityCounts = getIdentityCounts(room);
                let identities = Util.shuffle([
                    ...new Array(identityCounts[Identity.ZhongChen]).fill(Identity.ZhongChen),
                    ...new Array(identityCounts[Identity.FanZei]).fill(Identity.FanZei),
                    ...new Array(identityCounts[Identity.NeiJian]).fill(Identity.NeiJian),
                ]);
                for (let [i, player] of Object.entries(rest)) {
                    player.identity = identities[+i];
                }
            });
            room.earlierEvents.on(GameEarlierEvent.ExtraMaxHP, async (players: Player[]) => {
                if (room.players.length >= 5) {
                    let player = players.find(player => player.identity == Identity.ZhuGong) as Player;
                    await player.setMaxHP(player.maxHP + 1);
                    await player.setHP(player.maxHP);
                }
            });
            room.earlierEvents.on(GameEarlierEvent.ExtraSkill, async (players: Player[]) => {
                let player = players.find(player => player.identity == Identity.ZhuGong) as Player;
                let skills = player.general.skills.filter(skill => Game.getSkill(skill).emperor);
                for (let skill of skills) {
                    await player.getSkill(skill);
                }
            });
            room.events.on(GameEvent.RewardMurderer, async (murderer: Player | boolean, victim: Player) => {
                if (murderer instanceof Player) {
                    if (victim.identity == Identity.FanZei) {
                        await murderer.drawCards(3);
                    } else if (victim.identity == Identity.ZhongChen && murderer.identity == Identity.ZhuGong) {
                        await murderer.discard([...murderer.hand, ...murderer.equipZoneCards]);
                    }
                }
            });
            room.events.on(GameEvent.BeforeDie, async (victim: Player, murderer: Player) => {
                if (victim.identity == Identity.ZhuGong) {
                    await room.endGame(room.getPlayersByIdentity(Identity.FanZei, true));
                }
            }, Infinity);
            room.events.on(GameEvent.AfterConfirmInfo, async (victim: Player) => {
                let cnt = room.getPlayersCountByIdentities([Identity.FanZei, Identity.NeiJian]);
                if (cnt == 0) {
                    await room.endGame(room.getPlayersByIdentities([Identity.ZhuGong, Identity.ZhongChen], true));
                } else if (room.alivePlayers.length == 1 && room.alivePlayers[0].identity == Identity.NeiJian) {
                    await room.endGame(room.alivePlayers);
                }
            }, Infinity);
        },
    });
};
