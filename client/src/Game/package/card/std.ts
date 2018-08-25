///<reference path="../../Package.ts" />
///<reference path="../../AskingType.ts" />
void Package, AskingType;
Package.card.std = () => {
    const pkg = Game.createPackage('std/general');
    //基本牌
    pkg.createCardClass({
        name: 'Sha',
        tipName: '杀',
        type: CardType.Basic,
        enabled: (card: Card, player: Player): boolean =>
            !player.limitUseCount(card) || player.getFlag('useShaCount') < 1
        ,
        tip: (card: Card) => {
            let extra = Game.room.selfPlayer.extraMaxTargetCount(card);
            if (extra == 0)
                return '请选择1名角色，作为杀的目标';
            else
                return `可选择最多${1 + extra}名角色，作为杀的目标`;
        },
        filterSelect: (card: Card, player: Player, selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1 + player.extraMaxTargetCount(card))
                return [];
            else
                return targets.filter(e => e != player && (!e.limitDistance(card) || e.inAttackRange(player)));
        },
        selectCorrectly: (card: Card, player: Player, selected: Player[]): boolean =>
            selected.length > 0 &&
            selected.length <= 1 + player.extraMaxTargetCount(card) &&
            selected.every(e => (
                e != player &&
                e.inAttackRange(player)
            ))
        ,
    });
    pkg.createAsking({
        name: 'Shan',
        param: {
            tip: () => {
                let source = Game.room.players[Game.room.askingParam.source];
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xafff7d>${source.name + (source == target ? '(你)' : '')}</font>对你使用了一张杀，请使用一张闪`;
            },
            cardClassName: 'Shan',
        },
    });
    pkg.createCardClass({
        name: 'Shan',
        tipName: '闪',
        type: CardType.Basic,
        enabled: false,
    });

    pkg.createAsking({
        name: 'Tao',
        param: {
            tip: () => {
                let dyingPlayer = Game.room.players[Game.room.askingParam.dyingPlayer];
                let currentPlayer = Game.room.players[Game.room.askingParam.currentPlayer];
                let delta = Game.room.askingParam.delta;
                return `<font color=0xafff7d>${dyingPlayer.name + (currentPlayer == dyingPlayer ? '(你)' : '')}</font>处于濒死状态，请求<font color=0xafff7d>${currentPlayer.name}(你)</font>出${delta}个【桃】`;
            },
            cardClassName: 'Tao',
        },
    });
    pkg.createCardClass({
        name: 'Tao',
        tipName: '桃',
        type: CardType.Basic,
        enabled: (card: Card, player: Player): boolean => {
            return player.wounded;
        },
        tip: '使用桃你可回复1点体力',
    });
    //锦囊牌
    //    普通锦囊
    pkg.createCardClass({
        name: 'WuZhongShengYou',
        tipName: '无中生有',
        type: CardType.Bag,
        enabled: true,
        tip: '你可摸两张牌',
    });
    pkg.createAsking({
        name: 'NanManRuQin',
        param: {
            tip: () => {
                let source = Game.room.players[Game.room.askingParam.source];
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xafff7d>${source.name + (source == target ? '(你)' : '')}</font>使用了南蛮入侵，请打出一张杀`;
            },
            cardClassName: 'Sha',
        },
    });
    pkg.createCardClass({
        name: 'NanManRuQin',
        tipName: '南蛮入侵',
        type: CardType.Bag,
        enabled: true,
        tip: '使用南蛮入侵',
    });
    pkg.createAsking({
        name: 'WanJianQiFa',
        param: {
            tip: () => {
                let source = Game.room.players[Game.room.askingParam.source];
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xafff7d>${source.name + (source == target ? '(你)' : '')}</font>使用了万箭齐发，请打出一张闪`;
            },
            cardClassName: 'Shan',
        },
    });
    pkg.createCardClass({
        name: 'WanJianQiFa',
        tipName: '万箭齐发',
        type: CardType.Bag,
        enabled: true,
        tip: '使用万箭齐发',
    });
    pkg.createCardClass({
        name: 'TaoYuanJieYi',
        tipName: '桃园结义',
        type: CardType.Bag,
        enabled: true,
        tip: '使用桃园结义',
    });
    pkg.createAsking({
        name: 'WuXieKeJi',
        param: {
            tip: () => {
                let player = Game.room.selfPlayer;
                let asker = Game.room.players[Game.room.askingParam.asker];
                let cardClass = Game.cardClasses[Game.room.askingParam.causeCardClassName];
                return `<font color=0xafff7d>${asker ? asker.name + (asker == player ? '(你)' : '') : ''}</font>为${cardClass.tipName}询问无懈，是否使用无懈可击？`;
            },
            cardClassName: 'WuXieKeJi',
        },
    });
    pkg.createCardClass({
        name: 'WuXieKeJi',
        tipName: '无懈可击',
        type: CardType.Bag,
        enabled: false,
    });
    pkg.createAsking({
        name: 'JueDou',
        param: {
            tip: () => {
                let player = Game.room.selfPlayer;
                let source = Game.room.players[Game.room.askingParam.source];
                return `<font color=0xafff7d>${source.name + (source == player ? '(你)' : '')}</font>与你决斗，请打出一张杀`;
            },
            cardClassName: 'Sha',
        },
    });
    pkg.createCardClass({
        name: 'JueDou',
        tipName: '决斗',
        type: CardType.Bag,
        enabled: true,
        tip: (card: Card) => {
            let extra = Game.room.selfPlayer.extraMaxTargetCount(card);
            if (extra == 0)
                return '请选择一个目标与其决斗';
            else
                return `请选择${1 + extra}个目标与其决斗`;
        },
        filterSelect: (card: Card, player: Player, selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1 + player.extraMaxTargetCount(card))
                return [];
            else
                return targets.filter(e => e != player);
        },
        selectCorrectly: (card: Card, player: Player, selected: Player[]): boolean =>
            selected.length > 0 &&
            selected.length <= 1 + player.extraMaxTargetCount(card) &&
            selected.every(e => e != player)
        ,
    });
    pkg.createAsking({
        name: 'GuoHeChaiQiao',
        param: {
            title: () => {
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xffd800>过河拆桥</font> <font>选择弃置一张${target.name}的卡牌</font>`;
            },
            cardCount: 1,
        },
    });
    pkg.createCardClass({
        name: 'GuoHeChaiQiao',
        tipName: '过河拆桥',
        type: CardType.Bag,
        enabled: true,
        tip: (card: Card) => {
            let extra = Game.room.selfPlayer.extraMaxTargetCount(card);
            if (extra == 0)
                return '请选择一个目标，弃置其一张牌';
            else
                return `请选择${1 + extra}个目标，弃置每个目标各一张牌`;
        },
        filterSelect: (card: Card, player: Player, selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1 + player.extraMaxTargetCount(card))
                return [];
            else
                return targets.filter(e => e != player && e.hasZoneCard);
        },
        selectCorrectly: (card: Card, player: Player, selected: Player[]): boolean =>
            selected.length > 0 &&
            selected.length <= 1 + player.extraMaxTargetCount(card) &&
            selected[0] != player &&
            selected[0].hasZoneCard
        ,
    });
    pkg.createAsking({
        name: 'ShunShouQianYang',
        param: {
            title: () => {
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xffd800>顺手牵羊</font> <font>请选择一张${target.name}的卡牌</font>`;
            },
            cardCount: 1,
        },
    });
    pkg.createCardClass({
        name: 'ShunShouQianYang',
        tipName: '顺手牵羊',
        type: CardType.Bag,
        enabled: true,
        tip: (card: Card) => {
            let extra = Game.room.selfPlayer.extraMaxTargetCount(card);
            if (extra == 0)
                return '请选择一个目标，获得其一张牌';
            else
                return `请选择${1 + extra}个目标，获得每个目标各一张牌`;
        },
        filterSelect: (card: Card, player: Player, selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1 + player.extraMaxTargetCount(card))
                return [];
            else
                return targets.filter(e => e != player && (!e.limitDistance(card) || player.distanceTo(e) == 1) && e.hasZoneCard);
        },
        selectCorrectly: (card: Card, player: Player, selected: Player[]): boolean =>
            selected.length > 0 &&
            selected.length <= 1 + player.extraMaxTargetCount(card) &&
            selected.every(e => player.distanceTo(e) == 1 && e != player && e.hasZoneCard)
        ,
    });
    pkg.createCardClass({
        name: 'WuGuFengDeng',
        tipName: '五谷丰登',
        type: CardType.Bag,
        enabled: true,
        tip: '五谷丰登',
    });
    pkg.createAsking({
        name: 'JieDaoShaRen',
        param: {
            tip: () => {
                let player = Game.room.players[Game.room.askingParam.targets[0]];
                let source = Game.room.players[Game.room.askingParam.source];
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xafff7d>${source.name + (source == target ? '(你)' : '')}</font>对你使用借刀杀人，请你使用【杀】，否则你装备的武器将归<font color=0xafff7d>${source.name}</font>所有`;
            },
            cardClassName: 'Sha',
        },
    });
    pkg.createCardClass({
        name: 'JieDaoShaRen',
        tipName: '借刀杀人',
        type: CardType.Bag,
        enabled: true,
        tip: '选择一名装备区有武器的角色杀另一名角色，若其不杀，则其须将武器交给你',
        filterSelect: (card: Card, player: Player, selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 2 * (1 + player.extraMaxTargetCount(card)))
                return [];
            else
                return selected.length % 2 == 0 ?
                    targets.filter(e => e != player && e.hasEquipType(EquipType.Arm)) :
                    targets.filter(e => e.inAttackRange(selected[selected.length - 1]));
        },
        selectCorrectly: (card: Card, player: Player, selected: Player[]): boolean => {
            if (!(
                selected.length > 0 &&
                selected.length % 2 == 0 &&
                selected.length <= 2 * (1 + player.extraMaxTargetCount(card))
            )) return false;
            let pairs = selected.reduce((arr: Player[][], player, i) => {
                if (i % 2 == 1)
                    arr.push([selected[i - 1], player]);
                return arr;
            }, []);
            return pairs.every(pair => {
                let [source, target] = pair;
                return (
                    source != player &&
                    source.hasEquipType(EquipType.Arm) &&
                    target.inAttackRange(source)
                );
            });
        },
        showTargetLines: (player: Player, selected: Player[], show: (from: Player, to: Player, wait?: number) => void) => {
            let pairs = selected.reduce((arr: Player[][], player, i) => {
                if (i % 2 == 1)
                    arr.push([selected[i - 1], player]);
                return arr;
            }, []);
            pairs.forEach(pair => {
                let [source, target] = pair;
                show(player, source);
                show(source, target, 1);
            });
        },
    });
    //    延时锦囊
    pkg.createCardClass({
        name: 'LeBuSiShu',
        tipName: '乐不思蜀',
        type: CardType.Bag,
        delay: true,
        enabled: true,
        tip: '将乐不思蜀置入目标的判定区',
        filterSelect: (card: Card, player: Player, selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1)
                return [];
            else
                return targets.filter(e => e != player);
        },
        selectCorrectly: (card: Card, player: Player, selected: Player[]): boolean =>
            selected.length == 1 && selected[0] != player
        ,
    });
    pkg.createCardClass({
        name: 'ShanDian',
        tipName: '闪电',
        type: CardType.Bag,
        delay: true,
        enabled: (card: Card, player: Player): boolean => !player.hasCardClassInJudgeZone('ShanDian'),
        tip: '将闪电置入你的判定区',
    });
    //装备牌
    pkg.createSkill({
        name: '$BaGuaZhen',
        tipName: '八卦阵',
        type: SkillType.Lock,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, '$BaGuaZhen')
        ,
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'Shan');
        },
    });
    pkg.createCardClass({
        name: 'BaGuaZhen',
        tipName: '八卦阵',
        type: CardType.Equip,
        equipType: EquipType.Armor,
        enabled: true,
        tip: '装备八卦阵',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$BaGuaZhen')
                    return player.hasEquip('BaGuaZhen');
            });
        },
    });
    Predefined.createPlusHorse(pkg, {
        DiLu: '的卢',
        JueYing: '绝影',
        ZhuaHuangFeiDian: '爪黄飞电',
    });
    Predefined.createMinusHorse(pkg, {
        ChiTu: '赤兔',
        DaYuan: '大宛',
        ZiXing: '紫骍',
    });
    pkg.createSkill({
        name: '$GuanShiFu',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, '$GuanShiFu')
        ,
        filterCard: true,
        tip: () => `是否弃置两张牌发动贯石斧，强制对<font color=0xafff7d>${Game.room.players[Game.room.askingParam.target].name + (Game.room.askingParam.target == Game.room.selfPlayer.seatID ? '(你)' : '')}</font>造成伤害`,
        minCardCount: 2,
        maxCardCount: 2,
    });
    pkg.createCardClass({
        name: 'GuanShiFu',
        tipName: '贯石斧',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 3,
        enabled: true,
        tip: '装备贯石斧',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$GuanShiFu')
                    return player.hasEquip('GuanShiFu');
            });
        },
    });
    pkg.createSkill({
        name: '$FangTianHuaJi',
        type: SkillType.Lock,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.CalcExtraMaxTargetCount, (player: Player, card: Card, n: number) => {
                if (player.hasSkill('$FangTianHuaJi')) {
                    if (card.class.name == 'Sha' && player.hand.length == 1 && card == player.hand[0]) {
                        return n + 2;
                    }
                }
            });
        },
    });
    pkg.createCardClass({
        name: 'FangTianHuaJi',
        tipName: '方天画戟',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 4,
        enabled: true,
        tip: '装备方天画戟',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$FangTianHuaJi')
                    return player.hasEquip('FangTianHuaJi');
            });
        },
    });
    pkg.createSkill({
        name: '$ZhuGeLianNu',
        type: SkillType.Lock,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.LimitUseCount, (player: Player, card: Card) => {
                if (player.hasSkill('$ZhuGeLianNu')) {
                    if (card.class.name == 'Sha') {
                        return false;
                    }
                }
            });
        },
    });
    pkg.createCardClass({
        name: 'ZhuGeLianNu',
        tipName: '诸葛连弩',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 1,
        enabled: true,
        tip: '装备诸葛连弩',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$ZhuGeLianNu')
                    return player.hasEquip('ZhuGeLianNu');
            });
        },
    });
    pkg.createAsking({
        name: '$QiLinGong',
        param: {
            title: () => {
                let player = Game.room.selfPlayer;
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xffd800>麒麟弓</font> <font>选择弃置一张${target.name + (player == target ? '(你)' : '')}的马</font>`;  
            },
            cardCount: 1,
        },
    });
    pkg.createSkill({
        name: '$QiLinGong',
        tipName: '麒麟弓',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, '$QiLinGong')
        ,
        tip: () => `您是否对<font color=0xafff7d>${Game.room.players[Game.room.askingParam.target].name + (Game.room.askingParam.target == Game.room.selfPlayer.seatID ? '(你)' : '')}</font>使用 麒麟弓`,
    });
    pkg.createCardClass({
        name: 'QiLinGong',
        tipName: '麒麟弓',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 5,
        enabled: true,
        tip: '装备麒麟弓',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$QiLinGong')
                    return player.hasEquip('QiLinGong');
            });
        },
    });
    pkg.createSkill({
        name: '$QingGangJian',
        type: SkillType.Lock,
    });
    pkg.createCardClass({
        name: 'QingGangJian',
        tipName: '青釭剑',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 2,
        enabled: true,
        tip: '装备青釭剑',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$QingGangJian')
                    return player.hasEquip('QingGangJian');
            });
        },
    });
    pkg.createAsking({
        name: '$QingLongYanYueDao',
        param: {
            tip: () => {
                let player = Game.room.selfPlayer;
                let target = Game.room.players[Game.room.askingParam.targets[0]];
                return `是否发动青龙偃月刀继续对<font color=0xafff7d>${target.name + (player == target ? '(你)' : '')}</font>使用杀`;
            },
            cardClassName: 'Sha',
        },
    });
    pkg.createSkill({
        name: '$QingLongYanYueDao',
        tipName: '青龙偃月刀',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, '$QingLongYanYueDao')
        ,
        filterSelect: true,
    });
    pkg.createCardClass({
        name: 'QingLongYanYueDao',
        tipName: '青龙偃月刀',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 3,
        enabled: true,
        tip: '装备青龙偃月刀',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$QingLongYanYueDao')
                    return player.hasEquip('QingLongYanYueDao');
            });
        },
    });
    pkg.createSkill({
        name: '$ZhangBaSheMao',
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
        tip: '是否发动丈八蛇矛将两张手牌当杀使用或打出',
        minCardCount: 2,
        maxCardCount: 2,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] => cards.filter(card => card.inHand),
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) =>
            player.room.makeVirtualCard('Sha', cards)
        ,
        init: (room: Room) => {
            room.require(RequireType.CardClass, 'Sha');
        },
    });
    pkg.createCardClass({
        name: 'ZhangBaSheMao',
        tipName: '丈八蛇矛',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 3,
        enabled: true,
        tip: '装备丈八蛇矛',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$ZhangBaSheMao')
                    return player.hasEquip('ZhangBaSheMao');
            });
        },
    });
    pkg.createSkill({
        name: '*CiXiongShuangGuJian_target',
        type: SkillType.Normal,
        tip: () => {
            let name = Game.room.players[Game.room.askingParam.source].name + (Game.room.askingParam.source == Game.room.selfPlayer.seatID ? '(你)' : '');
            return `${name}发动雌雄双股剑，请弃置一张手牌或点取消让${name}摸一张牌`;
        },
        maxCardCount: 1,
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] =>
            cards.filter(card => card.inHand)
        ,
    });
    pkg.createSkill({
        name: '$CiXiongShuangGuJian',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, '$CiXiongShuangGuJian')
        ,
        tip: () => `您是否对<font color=0xafff7d>${Game.room.players[Game.room.askingParam.target].name + (Game.room.askingParam.target == Game.room.selfPlayer.seatID ? '(你)' : '')}</font>使用 雌雄双股剑`,
    });
    pkg.createCardClass({
        name: 'CiXiongShuangGuJian',
        tipName: '雌雄双股剑',
        type: CardType.Equip,
        equipType: EquipType.Arm,
        attackRange: 2,
        enabled: true,
        tip: '装备雌雄双股剑',
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.HasSkill, (player: Player, skillName: string) => {
                if (skillName == '$CiXiongShuangGuJian')
                    return player.hasEquip('CiXiongShuangGuJian');
            });
        },
    });
};