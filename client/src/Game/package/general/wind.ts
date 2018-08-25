///<reference path="../../Package.ts" />
///<reference path="../../AskingType.ts" />
void Package, AskingType;
Package.general.wind = () => {
    const pkg = Game.createPackage('wind');
    pkg.createSkill({
        name: 'CaoRenJuShou',
        tipName: '据守',
        type: SkillType.Normal,
        enabled: (player: Player) =>
            player.room.askPlayers.includes(player) &&
            player.room.askingMatch(AskingType.UseSkill, 'CaoRenJuShou')
        ,
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