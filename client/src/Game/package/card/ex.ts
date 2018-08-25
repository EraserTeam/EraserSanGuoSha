///<reference path="../../Package.ts" />
///<reference path="../../AskingType.ts" />
void Package, AskingType;
Package.card.ex = () => {
    const pkg = Game.createPackage('ex');
    pkg.createSkill({
        name: '$RenWangDun',
        type: SkillType.Lock,
    });
    pkg.createCardClass({
        name: 'RenWangDun',
        tipName: '仁王盾',
        type: CardType.Equip,
        equipType: EquipType.Armor,
        enabled: true,
        tip: '装备仁王盾',
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
            tip: () => {
                let player = Game.room.selfPlayer;
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xffd800>寒冰剑</font> <font>选择弃置一张${target.name + (player == target ? '(你)' : '')}的卡牌</font>`;
            },
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
        tipName: '寒冰剑',
    });
    pkg.createCardClass({
        name: 'HanBingJian',
        tipName: '寒冰剑',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 2,
        enabled: true,
        tip: '装备寒冰剑',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$HanBingJian')
                    return player.hasEquip('HanBingJian');
            });
        },
    });
};