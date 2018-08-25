///<reference path="../../Package.ts" />
void Package;
Package.general.std = () => {
    const pkg = Game.createPackage('std/card');
    pkg.createSkill({
        name: 'HuangGaiKuRou',
        tipName: '苦肉',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.PlayCard)
        ,
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
        tip: '选择一张黑色花色的手牌当【闪】使用',
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
        tip: '选择一张红色手牌或装备当【桃】使用',
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
        tip: '请选择弃置一张手牌，然后选择一名目标，点击确定为其回复1点体力',
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
        tip: '把一张黑色的手牌或者装备当【过河拆桥】使用',
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
        tip: () => {
            if (UI.self.gameArea.selectedCount == 1)
                return '请选择要杀的目标';
            else
                return '选择一张红色的手牌或装备';
        },
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
        tip: () => `<font color=0xafff7d>${Game.room.players[Game.room.askingParam.player].name + (Game.room.askingParam.target == Game.room.selfPlayer.seatID ? '(你)' : '')}</font>发动了“刚烈”，请选两张手牌点确定弃置，或点取消收到1点伤害`,
    });
    pkg.createSkill({
        name: 'XiaHouDunGangLie',
        tipName: '刚烈',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'XiaHouDunGangLie')
        ,
        tip: () => `<font color=0xafff7d>${Game.room.players[Game.room.askingParam.source].name + (Game.room.askingParam.target == Game.room.selfPlayer.seatID ? '(你)' : '')}</font>对你造成伤害，是否发动“刚烈”`,
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
        tip: () => `您是否对<font color=0xafff7d>${Game.room.players[Game.room.askingParam.target].name + (Game.room.askingParam.target == Game.room.selfPlayer.seatID ? '(你)' : '')}</font>使用 铁骑`,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.CanAnswerCard, (player: Player, card: Card, by: string) => {
                if (by == 'Shan' && card.cardID == player.getFlag('MaChaoTieQiEffect'))
                    return false;
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
        tip: () => '选择一张杀或闪',
        filterCard: (skill: ISkill, player: Player, selectedCards: Card[], cards: Card[]): Card[] => {
            if (player.room.askPlayers.includes(player) && player.room.askingType == AskingType.PlayCard || player.room.askingParam.cardClassName == 'Sha') {
                return cards.filter(card => card.class.name == 'Shan');
            } else {
                return cards.filter(card => card.class.name == 'Sha');
            }
        }
        ,
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) => {
            if (cards[0].class.name == 'Sha') {
                return player.room.makeVirtualCard('Shan', cards);
            } else if (cards[0].class.name == 'Shan') {
                return player.room.makeVirtualCard('Sha', cards);
            } else {
                return undefined as any;
            }
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
    });
    pkg.createAsking({
        name: 'ZhouYuFanJian',
        param: {
            tip: () => {
                let target = Game.room.players[Game.room.askingParam.target];
                return `<font color=0xafff7d>${target.name}</font>对你发动了“反间”，请选择一种花色`;
            },
        },
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
    });
    pkg.createAsking({
        name: 'LiuBeiJiJiang',
        param: {
            cardClassName: 'Sha',
            tip: () => {
                let source = Game.room.players[Game.room.askingParam.source];
                let name = `<font color=0xafff7d>${source.name}</font>`;
                return `${name}动激将，请你替${name}打出【杀】`;
            },
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
        tip: '选择你要杀的角色，点击确定发动，其他蜀国武将可以替你出杀',
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) => {
            return player.room.makeVirtualCard('Sha');
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
        tip: '请选择你要"制衡"的手牌或者装备牌',
        filterCard: true,
    });
    pkg.createSkill({
        name: 'SunQuanJiuYuan',
        tipName: '救援',
        emperor: true,
        type: SkillType.Lock,
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
    });
    pkg.createAsking({
        name: 'CaoCaoHuJia',
        param: {
            cardClassName: 'Shan',
            tip: () => {
                let source = Game.room.players[Game.room.askingParam.source];
                return `你是否帮<font color=0xafff7d>${source.name}</font>护驾`;
            },
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
        viewAs: (skill: ISkill, player: Player, cards: Card[], selected: Player[], skillParam: any) => {
            return player.room.makeVirtualCard('Shan');
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
        tip: '选择一张方块牌当【乐不思蜀】，并选择一名目标',
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
        tip: () => {
            let source = Game.room.players[Game.room.askingParam.source];
            return `选择一张牌，并选择一名角色将<font color=0xafff7d>${source.name}</font>对你的杀转移给该角色`;
        },
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
        tip: '选择两张要弃置的手牌，并选择一名已受伤的男性为目标',
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 1)
                return [];
            else
                return targets.filter(e => e.wounded && e.sex == Sex.Male);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 1
        ,
    });
    pkg.createSkill({
        name: 'SunShangXiangXiaoJi',
        tipName: '枭姬',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'SunShangXiangXiaoJi')
        ,
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
        tip: '选择一张牌，并选择两名男性角色为目标',
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 2)
                return [];
            else
                return targets.filter(e => e.sex == Sex.Male && !selected.includes(e));
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 2
        ,
        showTargetLines: (player: Player, selected: Player[], show: (from: Player, to: Player, wait?: number) => void) => {
            show(player, selected[1]);
            show(selected[1], selected[0], 1);
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
        tip: '选择1至2名角色为目标，从他们的手牌里各抽取一张牌',
        filterSelect: (skill: ISkill, player: Player, cards: Card[], selected: Player[], targets: Player[]): Player[] => {
            if (selected.length == 2)
                return [];
            else
                return targets.filter(e => e != player && e.hand.length);
        },
        selectCorrectly: (skill: ISkill, player: Player, cards: Card[], selected: Player[]) =>
            selected.length == 1 || selected.length == 2
        ,
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
    });
    pkg.createSkill({
        name: 'HuangYueYingQiCai',
        tipName: '奇才',
        type: SkillType.Lock,
        init: (room: Room) => {
            room.syncEvents.on(GameSyncEvent.LimitUseCount, (player: Player, card: Card) => {
                if (player.hasSkill('HuangYueYingQiCai')) {
                    if (card.class.type == CardType.Bag) {
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