import AskingType from './AskingType';
import Card from './Card';
import CardType from './CardType';
import Country from './Country';
import EffectPosition from './EffectPosition';
import EquipType from './EquipType';
import Game from './Game';
import GameEvent, { GameSyncEvent } from './GameEvent';
import ICardClass from './ICardClass';
import Identity from './Identity';
import IGeneral from './IGeneral';
import Interval from './Interval';
import ISkill from './ISkill';
import IUser from './IUser';
import Package from './Package';
import Pile from './Pile';
import Room from './Room';
import Sex from './Sex';
import Skill from './Skill';
import { Socket } from './Socket';
import Suit from './Suit';
import * as Util from './Util';
import Zone from './Zone';
class Player {
    public user: IUser;
    public socket!: Socket;
    public seatID: number;
    public hand: Pile = new Pile();
    public judgeZone: Pile = new Pile();
    public equipZone: Array<Card | undefined> = [undefined, undefined, undefined, undefined];
    public seatNum!: number;
    private _maxHP!: number;
    private _HP!: number;
    private _alive!: boolean;
    public skills: Skill[] = [];
    private flag: any = {};
    private _general!: IGeneral;
    private _name!: string;
    private _country!: Country;
    private _sex!: Sex;
    private _identity!: Identity;
    private _dying!: boolean;
    public identityShown = false;
    private _back: boolean = false;
    constructor(user: IUser, seatID: number) {
        this.user = user;
        this.seatID = seatID;
    }
    public get room(): Room {
        return this.user.room as Room;
    }
    public initSocket() {
    }
    public async drawCards(cards: Card[]): Promise<void>;
    public async drawCards(num: number): Promise<void>;
    public async drawCards(param: Card[] | number): Promise<void> {
        if (typeof param == 'number') {
            let num: number = param;
            let cards: Card[] = this.room.getCardPileTopCards(num);
            this.drawCards(cards);
        } else {
            let cards: Card[] = param;
            await this.room.moveCards({
                toSeatID: this.seatID,
                fromZone: Zone.CardPile,
                toZone: Zone.Hand,
                cards,
            });
        }
    }
    public async discard([...cards]: Card[]) {
        if (cards.length <= 0) return;
        //弃置:将一名角色区域里的牌置入处理区，然后将之置入弃牌堆。
        await this.room.moveCards({
            toZone: Zone.Dispose,
            cards,
        });
        await this.room.moveCards({
            fromZone: Zone.Dispose,
            toZone: Zone.DiscardPile,
            cards,
        });
    }
    public async respondCard(card: Card) {
        //打出:声明一张牌，然后将之置入处理区，最后将之置入弃牌堆。
        this.room.sockets.emit('respond card', {
            seatID: this.seatID,
            cardID: card.cardID,
            cardClassFullName: card.class.fullName,
            color: card.color,
        });
        await this.room.moveCards({
            toZone: Zone.Dispose,
            cards: [card],
        });
        await this.room.moveCards({
            fromZone: Zone.Dispose,
            toZone: Zone.DiscardPile,
            cards: [card],
        });
    }
    public async useCard(card: Card, selected: Player[], targets: Player[] | Card) {
        let cardClass = card.class;
        /**
         * useType
         * 1：置入处理区，然后置入弃牌堆
         * 2：置入判定区
         * 3：置入装备区
         */
        this.room.sockets.emit('use card', {
            seatID: this.seatID,
            cardID: card.cardID,
            cardClassFullName: cardClass.fullName,
            color: card.color,
            selected: selected.map(e => e.seatID),
        });
        await this.room.moveCards({
            toZone: Zone.Dispose,
            cards: [card],
        });
        let cardsToThrow: Card[] = [];
        let flag = {};
        let ret;
        let useType = 0;
        if (cardClass.type == CardType.Basic || cardClass.type == CardType.Bag && !cardClass.delay) useType = 1;
        else if (cardClass.type == CardType.Bag && cardClass.delay) useType = 2;
        else if (cardClass.type == CardType.Equip) useType = 3;
        if (useType != 1 && targets instanceof Card) throw new Error('targets type error');
        await this.triggerEventUseCard(card, flag);
        if (targets instanceof Card) {
            cardsToThrow.push(card);
            ret = await this.room.cardEffect(card, this, selected, []);
        } else {
            let invalidTargets: Player[] = [];
            await (async () => {
                targets = targets.filter(e => e.alive);
                if (targets.length == 0) return;
                targets = Game.sortPlayersBySeatNum(targets, this.room.round.player);
                targets = await this.triggerEventSetTarget(card, selected, targets, flag);
                targets = targets.filter(e => e.alive);
                if (targets.length == 0) return;
                targets = Game.sortPlayersBySeatNum(targets, this.room.round.player);
                targets = await this.triggerEventBecomeTarget(card, selected, targets, flag);
                targets = targets.filter(e => e.alive);
                if (targets.length == 0) return;
                targets = Game.sortPlayersBySeatNum(targets, this.room.round.player);
                await this.triggerEventAfterSetTarget(card, selected, targets, flag);
                await this.triggerEventAfterBecomeTarget(card, selected, targets, flag);
                invalidTargets = await this.triggerEventSetInvalidTarget(card, selected, targets, flag);
                targets = Game.sortPlayersBySeatNum(targets, this);
            })();
            if (useType == 1) {
                cardsToThrow.push(card);
                for (let target of targets) {
                    if (!invalidTargets.includes(target))
                        await this.room.cardEffect(card, this, selected, targets, target);
                }
            } else if (useType == 2) {
                await this.room.moveCards({
                    toSeatID: targets[0].seatID,
                    toZone: Zone.Judge,
                    cards: [card],
                });
            } else {
                if (targets.length == 0) {
                    cardsToThrow.push(card);
                } else {
                    let equipType = cardClass.equipType;
                    let hasEquip = this.hasEquipType(equipType);
                    if (hasEquip) {
                        let oldEquip = this.equipZone[equipType] as Card;
                        await this.room.moveCards({
                            fromSeatID: this.seatID,
                            fromZone: Zone.Equip,
                            toZone: Zone.Dispose,
                            cards: [oldEquip],
                        });
                        cardsToThrow.push(oldEquip);
                    }
                    await this.room.moveCards({
                        toSeatID: this.seatID,
                        toZone: Zone.Equip,
                        cards: [card],
                    });
                }
            }
        }
        await this.triggerEventUseCardEnd(card, flag);
        if (cardsToThrow.length != 0) {
            await this.room.moveCards({
                fromZone: Zone.Dispose,
                toZone: Zone.DiscardPile,
                cards: cardsToThrow,
            });
        }
        await this.triggerEventAfterUseCardEnd(card, flag);
        return ret;
    }
    private async triggerEventUseCard(card: Card, flag: any) {
        return await this.room.events.emit(GameEvent.UseCard, card, this, flag);
    }
    private async triggerEventSetTarget(card: Card, selected: Player[], targets: Player[], flag: any) {
        await this.room.events.callbackEmit(GameEvent.SetTarget, async (listener) => {
            let ret = await listener(card, this, selected, targets, flag);
            if (Array.isArray(ret))
                targets = ret;
        });
        return targets;
    }
    private async triggerEventBecomeTarget(card: Card, selected: Player[], targets: Player[], flag: any) {
        await this.room.events.callbackEmit(GameEvent.BecomeTarget, async (listener) => {
            let ret = await listener(card, this, selected, targets, flag);
            if (Array.isArray(ret))
                targets = ret;
        });
        return targets;
    }
    private async triggerEventAfterSetTarget(card: Card, selected: Player[], targets: Player[], flag: any) {
        return await this.room.events.emit(GameEvent.AfterSetTarget, card, this, selected, targets, flag);
    }
    private async triggerEventAfterBecomeTarget(card: Card, selected: Player[], targets: Player[], flag: any) {
        return await this.room.events.emit(GameEvent.AfterBecomeTarget, card, this, selected, targets, flag);
    }
    private async triggerEventSetInvalidTarget(card: Card, selected: Player[], targets: Player[], flag: any) {
        let invalidTargets: Player[] = [];
        await this.room.events.callbackEmit(GameEvent.SetInvalidTarget, async (listener) => {
            let ret = await listener(card, this, selected, targets, invalidTargets, flag);
            if (Array.isArray(ret))
                invalidTargets = ret;
        });
        return invalidTargets;
    }
    private async triggerEventUseCardEnd(card: Card, flag: any) {
        return await this.room.events.emit(GameEvent.UseCardEnd, card, this, flag);
    }
    private async triggerEventAfterUseCardEnd(card: Card, flag: any) {
        return await this.room.events.emit(GameEvent.AfterUseCardEnd, card, this, flag);
    }
    public async getCards([...cards]: Card[]) {
        if (cards.length <= 0) return;
        await this.room.moveCards({
            toSeatID: this.seatID,
            toZone: Zone.Hand,
            cards,
        });
    }
    public async judge(callbackAfterEffect?: (card: Card) => Promise<void>) {
        /*  判定:亮出牌堆顶的一张牌（称为“判定牌”），以等待此判定牌生效的操作。
            生效后的判定牌的花色、点数、名称等信息即为此次判定的结果。
            当判定牌生效后须将之置入弃牌堆。
            角色因判定而亮出的牌堆顶的一张牌称为该角色的判定牌。
        */
        let card = (await this.room.lighten(Zone.CardPile, 1))[0];
        await this.room.timeout(Interval.Judge);
        let result = {
            name: card.class.name,
            number: card.number,
            suit: card.suit,
        };
        callbackAfterEffect && await callbackAfterEffect(card);
        await this.room.moveCards({
            fromZone: Zone.Dispose,
            toZone: Zone.DiscardPile,
            cards: [card],
        });
        return result;
    }
    public async turnover(back?: boolean) {
        if (typeof back == 'undefined') {
            this.backSide = !this.back;
        } else if (this.back != back) {
            this.backSide = back;
        }
    }
    public get maxHP(): number {
        return this._maxHP;
    }
    public async setMaxHP(maxHP: number) {
        this._maxHP = maxHP;
        this.room.sockets.emit('set maxHP', {
            seatID: this.seatID,
            maxHP,
        });
    }
    public get HP(): number {
        return this._HP;
    }
    /*
        若source为Player 则伤害来源为玩家
        若source为true 则无伤害来源
        若source为false 则为体力流失
    */
    public async setHP(HP: number, source: Player | boolean = false) {
        let reduce = HP < this._HP;
        if (reduce) {
            let alive = await this.room.events.emit(GameEvent.BeforeReduceHP, this, source, HP);
        }
        this._HP = HP;
        this.room.sockets.emit('set HP', {
            seatID: this.seatID,
            HP,
            source: source instanceof Player ? source.seatID : source,
        });
        if (reduce) {
            let skip = false;
            await this.room.events.callbackEmit(GameEvent.ReduceHP, async (listener) => {
                if (await listener(this, source, HP))
                    skip = true;
            });
            if (this.HP <= 0 && !skip)
                await this.getDying(source);
            let alive = await this.room.events.emit(GameEvent.AfterReduceHP, this, source, HP);
        }
    }
    private async getDying(source: Player | boolean) {
        this.dying = true;
        await this.room.events.emit(GameEvent.GetDying, this);
        if (this.HP > 0) {
            this.dying = false;
            return;
        }
        for (let target of Game.sortPlayersBySeatNum(this.room.alivePlayers, this.room.round.player)) {
            while (this.HP <= 0) {
                let delta = 1 - this.HP;
                let response = await this.room.events.emit(GameEvent.Dying, this, target, delta);
                if (!response)
                    break;
            }
            if (this.HP > 0) {
                this.dying = false;
                return;
            }
        }
        this.dying = false;
        await this.die(source);
        await this.room.events.emit(GameEvent.AfterDie, this);
    }
    public get dying(): boolean {
        return this._dying;
    }
    public set dying(dying: boolean) {
        this._dying = dying;
        if (dying) {
            this.room.sockets.emit('get dying', this.seatID);
        } else {
            this.room.sockets.emit('cancel dying', this.seatID);
        }
    }
    public get alive(): boolean {
        return this._alive;
    }
    public async setAlive(alive: boolean) {
        this._alive = alive;
        this.room.sockets.emit('set alive', {
            seatID: this.seatID,
            alive,
        });
    }
    public get general(): IGeneral {
        return this._general;
    }
    public set general(general: IGeneral) {
        this._general = general;
        this.room.sockets.emit('set general', {
            seatID: this.seatID,
            generalName: general.name,
        });
        this.name = general.tipName;
        this.country = general.country;
        this.sex = general.sex;
    }
    public get name(): string {
        return this._name;
    }
    public set name(name: string) {
        this._name = name;
    }
    public get country(): Country {
        return this._country;
    }
    public set country(country: Country) {
        this._country = country;
        this.room.sockets.emit('set country', {
            seatID: this.seatID,
            country,
        });
    }
    public get sex(): Sex {
        return this._sex;
    }
    public set sex(sex: Sex) {
        this._sex = sex;
        this.room.sockets.emit('set sex', {
            seatID: this.seatID,
            sex,
        });
    }
    public get identity(): Identity {
        return this._identity;
    }
    public set identity(identity: Identity) {
        this._identity = identity;
        this.socket.emit('set identity', {
            seatID: this.seatID,
            identity,
        });
    }
    public get back(): boolean {
        return this._back;
    }
    private set backSide(back: boolean) {
        this._back = back;
        this.room.sockets.emit('set back', {
            seatID: this.seatID,
            back,
        });
    }
    public get front(): boolean {
        return !this.back;
    }
    public get wounded() {
        return this.HP < this.maxHP;
    }
    public getFlag(key: string): any {
        return this.flag[key];
    }
    public setFlag(key: string, value: any) {
        this.flag[key] = value;
        this.room.sockets.emit('set flag', {
            seatID: this.seatID,
            key,
            value,
        });
    }
    public get equipCount(): number {
        let cnt = 0;
        this.equipZone.forEach(card => {
            if (card)
                cnt++;
        });
        return cnt;
    }
    public get equipZoneCards(): Card[] {
        return this.equipZone.filter(card => card) as Card[];
    }
    public async damaged(source: Player): Promise<void>;
    public async damaged(sourceCard: Card): Promise<void>;
    public async damaged(param: { source?: Player, n?: number, sourceCard?: Card }): Promise<void>;
    public async damaged(param: { source?: Player, n?: number, sourceCard?: Card } | Player | Card) {
        if (param instanceof Player)
            param = { source: param };
        else if (param instanceof Card)
            param = { sourceCard: param };
        let { source = true, n = 1, sourceCard = undefined } = param;

        let lose = await this.triggerEventBeforeDamageBegin(source, n, sourceCard);
        if (lose) {
            await this.loseHP(n);
            return;
        }

        let callback = await this.triggerEventBeforeCallDamaged(source, n, sourceCard);

        await this.triggerEventDamageBegin(source, n, sourceCard);

        if (n > 0 && source instanceof Player && source.alive)
            n = await this.triggerEventDamage(source, n, sourceCard);
        if (n > 0 && this.alive)
            n = await this.triggerEventDamaged(source, n, sourceCard);

        if (n > 0 && this.alive) {

            await this.setHP(this.HP - n, source);

            if (source instanceof Player && source.alive)
                await this.triggerEventAfterDamage(source, n, sourceCard);
            if (this.alive)
                await this.triggerEventAfterDamaged(source, n, sourceCard);
        }

        if (this.alive)
            await this.triggerEventDamageEnd(source, n, sourceCard);

        if (callback)
            await callback();
    }
    private async triggerEventBeforeCallDamaged(source: Player | true, n: number, sourceCard?: Card) {
        return await this.room.events.emit(GameEvent.$BeforeCallDamaged, source, this, n, sourceCard);
    }
    private async triggerEventBeforeDamageBegin(source: Player | true, n: number, sourceCard?: Card) {
        await this.room.events.emit(GameEvent.BeforeDamageBegin, source, this, n, sourceCard);
    }
    private async triggerEventDamageBegin(source: Player | true, n: number, sourceCard?: Card) {
        await this.room.events.emit(GameEvent.DamageBegin, source, this, n, sourceCard);
    }
    private async triggerEventDamage(source: Player, n: number, sourceCard?: Card): Promise<number> {
        await this.room.events.callbackEmit(GameEvent.Damage, async (listener) => {
            let ret = await listener(source, this, n, sourceCard);
            if (typeof ret != 'undefined')
                n = ret < 0 ? 0 : ret;
        });
        return n;
    }
    private async triggerEventDamaged(source: Player | true, n: number, sourceCard?: Card): Promise<number> {
        await this.room.events.callbackEmit(GameEvent.Damaged, async (listener) => {
            let ret = await listener(this, source, n, sourceCard);
            if (typeof ret != 'undefined')
                n = ret < 0 ? 0 : ret;
        });
        return n;
    }
    private async triggerEventAfterDamage(source: Player, n: number, sourceCard?: Card): Promise<void> {
        await this.room.events.emit(GameEvent.AfterDamage, source, this, n, sourceCard);
    }
    private async triggerEventAfterDamaged(source: Player | true, n: number, sourceCard?: Card): Promise<void> {
        await this.room.events.emit(GameEvent.AfterDamaged, this, source, n, sourceCard);
    }
    private async triggerEventDamageEnd(source: Player | true, n: number, sourceCard?: Card) {
        await this.room.events.emit(GameEvent.DamageEnd, source, this, n, sourceCard);
    }
    public async damage(target: Player): Promise<void>;
    public async damage(param: { target: Player, n?: number, sourceCard?: Card }): Promise<void>;
    public async damage(param: { target: Player, n?: number, sourceCard?: Card } | Player) {
        if (param instanceof Player)
            param = { target: param };
        let { target, n = 1, sourceCard = undefined } = param;
        await target.damaged({ source: this, n, sourceCard });
    }
    public async loseHP(n: number = 1) {
        await this.room.events.emit(GameEvent.LoseHP, this, n);
        if (n > 0 && this.alive) {
            await this.setHP(this.HP - n, false);
            await this.room.events.emit(GameEvent.AfterLoseHP, this, n);
        }
    }
    public async recover(param?: { source?: Player, n?: number, sourceCard?: Card }) {
        let { source = this, n = 1, sourceCard = undefined } = param || {};
        n = this.calcRecoverNumber(source, n, sourceCard);
        await this.room.events.emit(GameEvent.BeforeRecover, this, source, n, sourceCard);
        let HP = this.HP + n;
        if (HP > this.maxHP) {
            HP = this.maxHP;
        }
        await this.setHP(HP);
        await this.room.events.emit(GameEvent.AfterRecover, this, source, n, sourceCard);
    }
    private calcRecoverNumber(source: Player, n: number, sourceCard?: Card): number {
        this.room.syncEvents.callbackEmit(GameSyncEvent.CalcRecoverNumber, listener => {
            let ret = listener(this, source, n, sourceCard);
            if (typeof ret == 'undefined')
                return;
            n = ret;
        });
        return n;
    }
    public async die(source: Player | boolean = false) {
        await this.setAlive(false);
        await this.room.events.emit(GameEvent.BeforeDie, this, source);
        await this.room.events.emit(GameEvent.BeforeConfirmInfo, this);
        this.showIdentity();
        await this.room.events.emit(GameEvent.AfterConfirmInfo, this);
        await this.room.events.emit(GameEvent.Die, this, source);
        await this.discard([...this.hand, ...this.equipZoneCards, ...this.judgeZone]);
        await this.room.events.emit(GameEvent.RewardMurderer, source, this);
        await this.room.events.emit(GameEvent.AfterDie, source, this);
    }
    public async getSkill(skill: Skill): Promise<void>;
    public async getSkill(skillName: string): Promise<void>;
    public async getSkill(skill: Skill | string) {
        if (typeof skill == 'string')
            skill = new Skill(skill);
        if (this.hasSkill(skill.name))
            return;
        this.skills.push(skill);
        this.room.sockets.emit('get skill', {
            seatID: this.seatID,
            skillName: skill instanceof Skill ? skill.name : skill,
        });
    }
    public hasSkill(skillName: string): boolean {
        let hasSkill = this.skills.some(skill => skill.name == skillName);
        if (hasSkill)
            return true;
        return this.room.syncEvents.emit(GameSyncEvent.HasSkill, this, skillName);
    }
    public syncUseSkill(skillName: string) {
        this.room.sockets.emit('use skill', {
            seatID: this.seatID,
            skillName,
        });
    }
    public async useSkill(skillName: string, skillParam: () => Promise<any>, selected?: Player[]): Promise<any>;
    public async useSkill(skillName: string, skillParam?: any, check?: boolean): Promise<any>;
    public async useSkill(skillName: string, skillParam?: any, check: boolean | Player[] = true): Promise<any> {
        let callback = await this.room.events.emit(GameEvent.$BeforeCallUseSkill, this, skillName, skillParam);
        let skill = this.skills.find(skill => skill.name == skillName) || Game.getSkill(skillName);
        let ret = await (async () => {
            if (typeof skillParam == 'function') {
                if (typeof check == 'boolean')
                    check = [];
                this.room.sockets.emit('use skill', {
                    seatID: this.seatID,
                    skillName,
                    selected: check.map((e: Player) => e.seatID),
                });
                await skillParam();
            } else {
                if (check)
                    this.checkSkillParam(skill, skillParam);
                this.room.sockets.emit('use skill', {
                    seatID: this.seatID,
                    skillName,
                    selected: (skillParam && Array.isArray(skillParam.selected)) ? skillParam.selected.map((e: Player) => e.seatID) : [],
                });
                if (typeof skillParam == 'undefined')
                    skillParam = {};
                await this.skillEffect(skill, skillParam);
                return skill.viewAs && skill.viewAs(skill, this, skillParam.cards, skillParam.selected, skillParam);
            }
        })();
        if (callback)
            await callback();
        return ret;
    }
    private async skillEffect(skill: ISkill, skillParam?: any): Promise<any> {
        if (skill.effect)
            return await skill.effect(skill, this, skillParam);
    }
    private formatSkillParam(skill: ISkill, skillParam?: any) {
        let select = skill.filterCard != Package.skillFilterCardDefault || skill.filterSelect;
        if (skillParam) {
            if (skillParam.cards)
                throw new Error('cards should not be in skillParam');
            if (skillParam.cardIDs) {
                if (!Array.isArray(skillParam.cardIDs))
                    throw new Error('cardIDs type error');
                skillParam.cards = this.room.getCardsByID(skillParam.cardIDs);
                delete skillParam.cardIDs;
            } else if (select) {
                skillParam.cards = [];
            }
            if (skillParam.selected) {
                if (!Array.isArray(skillParam.selected))
                    throw new Error('selected type error');
                skillParam.selected = Util.removeRepeat(skillParam.selected);
                skillParam.selected = (skillParam.selected as number[]).map(seatID => this.room.getPlayerBySeatID(seatID, true));
            } else if (select) {
                skillParam.selected = [];
            }
        } else if (select) {
            throw new Error('missing skillParam');
        }
        this.checkSkillParam(skill, skillParam);
    }
    private checkSkillParam(skill: ISkill, skillParam?: any) {
        if (skill.cancel && !skillParam)
            return;
        if (skill.filterCard != Package.skillFilterCardDefault || skill.filterSelect) {
            if (skillParam.cards.length < skill.minCardCount || skillParam.cards.length > skill.maxCardCount) {
                throw new Error('select cards incorrectly');
            }
            if (skill.filterCard) {
                let cards = [...this.hand, ...this.equipZoneCards];
                for (let i = 0; i < skillParam.cards.length; i++) {
                    let selectedCards = skillParam.cards.slice(0, i);
                    cards = cards.filter(card => !selectedCards.includes(card));
                    if (!skill.filterCard(skill, this, selectedCards, cards).includes(skillParam.cards[i]))
                        throw new Error('select cards incorrectly');
                }
            } else {
                if (skillParam.cards.some((card: Card) => ![...this.hand, ...this.equipZoneCards].includes(card))) {
                    throw new Error('The player has not some of these cards.');
                }
            }
            if (skill.name[0] == '$') {
                let equipName = skill.name.slice(1);
                skillParam.cards.forEach((card: Card) => {
                    this.equipZoneCards.forEach(equip => {
                        if (equip == card && card.class.name == equipName)
                            throw new Error(`${equipName} is not allowed to be thrown.`);
                    });
                });
            }
            if (skill.filterSelect) {
                let players = this.room.alivePlayers;
                for (let i = 0; i < skillParam.selected.length; i++) {
                    let selected = skillParam.selected.slice(0, i);
                    let targets = players.filter(player => !selected.includes(player));
                    if (!skill.filterSelect(skill, this, skillParam.cards, selected, targets).includes(skillParam.selected[i]))
                        throw new Error('select players incorrectly');
                }
            }
            if (!skill.selectCorrectly(skill, this, skillParam.cards, skillParam.selected)) {
                throw new Error('select incorrectly');
            }
        }
    }
    public async respondBySkill(skillName: string, skillParam?: any): Promise<Card | undefined> {
        let skill: ISkill | undefined = this.skills.find(skill => skill.name == skillName);
        if (!skill) {
            if (this.hasSkill(skillName))
                skill = Game.getSkill(skillName);
            else
                return;
        }
        if (!skill.enabled(this))
            return;
        this.formatSkillParam(skill, skillParam);
        let restartAsking = this.room.restartAsking;
        this.room.endAsk();
        let card = await this.useSkill(skill.name, skillParam, false);
        if (card instanceof Card) {
            return card;
        } else {
            await restartAsking();
            return;
        }
    }
    public showIdentity() {
        this.identityShown = true;
        this.room.sockets.emit('set identity', {
            seatID: this.seatID,
            identity: this.identity,
        });
    }
    public hasCardClass(cardClassName: string): boolean {
        return this.hand.some(card => card.class.name == cardClassName);
    }
    public hasCardClassInJudgeZone(cardClassName: string): boolean {
        return this.judgeZone.some(card => card.class.name == cardClassName);
    }
    public hasEquipType(equipType: EquipType): boolean {
        return typeof this.equipZone[equipType] != 'undefined';
    }
    public hasEquip(equipClass: string): boolean {
        let cardClass: ICardClass = Game.cardClasses[equipClass];
        if (cardClass.equipType == EquipType.Armor && this.armorInvalid())
            return false;
        else
            return this.equipZone.some(card => !!(card && card.class.name == equipClass));
    }
    public get hasCard(): boolean {
        return this.hand.length > 0 || this.equipZoneCards.length > 0;
    }
    public get hasZoneCard(): boolean {
        return this.hand.length > 0 || this.equipZoneCards.length > 0 || this.judgeZone.length > 0;
    }
    public hasTheCard(card: Card) {
        return this.hand.includes(card) || this.equipZone.includes(card);
    }
    public hasCards(cards: Card[]) {
        return cards.every(card => this.hasTheCard(card));
    }
    public distanceTo(toPlayer: Player): number {
        let distance: number;
        if (toPlayer == this)
            distance = 0;
        else {
            distance = this.calcDistanceBySeatNum(toPlayer);
            this.room.syncEvents.callbackEmit(GameSyncEvent.CalcDistance, listener => {
                let ret = listener(this, toPlayer, distance);
                if (typeof ret == 'undefined')
                    return;
                distance = ret;
                if (distance < 1)
                    distance = 1;
            });
        }
        return distance;
    }
    private calcDistanceBySeatNum(toPlayer: Player): number {
        let players = Game.sortPlayersBySeatNum(this.room.alivePlayers, this);
        let [fromIndex, toIndex] = [players.indexOf(this), players.indexOf(toPlayer)];
        if (fromIndex == -1)
            throw new Error('Cannot find fromPlayer.Maybe he was dead.');
        if (toIndex == -1)
            throw new Error('Cannot find toIndex.Maybe he was dead.');
        let distanceCCW = toIndex - fromIndex;
        let distanceCW = players.length - distanceCCW;
        return distanceCW < distanceCCW ? distanceCW : distanceCCW;
    }
    public get attackRange(): number {
        let arm = this.equipZone[EquipType.Arm];
        return arm ? arm.class.attackRange : 1;
    }
    public inAttackRange(ofPlayer: Player): boolean {
        if (ofPlayer == this)
            return false;
        return ofPlayer.attackRange >= ofPlayer.distanceTo(this);
    }
    public limitUseCount(card: Card): boolean {
        let bool = true;
        this.room.syncEvents.callbackEmit(GameSyncEvent.LimitUseCount, listener => {
            let ret = listener(this, card);
            if (typeof ret != 'undefined')
                bool = ret;
        });
        return bool;
    }
    public limitDistance(card: Card): boolean {
        let bool = true;
        this.room.syncEvents.callbackEmit(GameSyncEvent.LimitDistance, listener => {
            let ret = listener(this, card);
            if (typeof ret != 'undefined')
                bool = ret;
        });
        return bool;
    }
    public extraMaxTargetCount(card: Card): number {
        let n = 0;
        this.room.syncEvents.callbackEmit(GameSyncEvent.CalcExtraMaxTargetCount, listener => {
            let ret = listener(this, card, n);
            if (typeof ret != 'undefined')
                n = ret;
        });
        return n;
    }
    public ignoreArmor(player: Player): boolean {
        return this.room.syncEvents.emit(GameSyncEvent.IgnoreArmor, this, player);
    }
    public armorInvalid(): boolean {
        return this.room.syncEvents.emit(GameSyncEvent.ArmorInvalid, this);
    }
    public canAnswerCard(card: Card, by: string): boolean {
        let ret = this.room.syncEvents.emit(GameSyncEvent.CanAnswerCard, this, card, by);
        if (typeof ret == 'undefined')
            ret = true;
        return ret;
    }
    public cardFilterSelect(card: Card, selected: Player[], targets: Player[]): Player[] {
        if (!card.class.filterSelect) return [];
        let players = targets.filter(player =>
            !(
                card.class.type == CardType.Bag &&
                card.class.delay &&
                player.hasCardClassInJudgeZone(card.class.name)
            ),
        );
        return card.class.filterSelect(card, this, selected, players);
    }
    public cardSelectCorrectly(card: Card, selected: Player[]): boolean {
        for (let player of selected) {
            if (!player.alive)
                return false;
            if (card.class.type == CardType.Bag && card.class.delay && player.hasCardClassInJudgeZone(card.class.name))
                return false;
        }
        let players = this.room.alivePlayers;
        for (let i = 0; i < selected.length; i++) {
            let currentSelected = selected.slice(0, i);
            let targets = players.filter(player => !currentSelected.includes(player));
            if (!this.cardFilterSelect(card, currentSelected, targets).includes(selected[i]))
                return false;
        }
        return card.class.selectCorrectly(card, this, selected);
    }
    public cardEnabled(card: Card) {
        return card.class.enabled(card, this);
    }
    public askPlayCard(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.room.round.checkDeath()) {
                resolve();
                return;
            }
            this.room.beginAsk(AskingType.PlayCard, '', this, async () => {
                if (this.alive)
                    resolve(await this.askPlayCard());
                else
                    resolve();
            });
            this.socket.emit('ask play card', {
                seatID: this.seatID,
            });
            let listeners = [
                {
                    player: this,
                    eventName: 'end play card',
                    listener: async () => {
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: false,
                        });
                        this.room.endAsk();
                        this.room.round.next();
                        resolve();
                    },
                },
                {
                    player: this,
                    eventName: 'use card',
                    listener: async (data: { cardID?: number, selected: number[], skill: string, skillParam: any }) => {
                        let card: Card | undefined;
                        if (typeof data.cardID == 'undefined') {
                            data.selected = data.skillParam && data.skillParam.selected || [];
                            card = await this.respondBySkill(data.skill, data.skillParam);
                            if (!card)
                                return;
                        } else {
                            card = this.room.getCardByID(data.cardID);
                            if (this.hand.every(e => e != card))
                                throw new Error('select incorrectly');
                        }
                        let cardClass = card.class;
                        if (!data.skill)
                            if (!this.cardEnabled(card))
                                throw new Error('The card is disabled.');
                        data.selected = Util.removeRepeat(data.selected);
                        let selected: Player[] = data.selected.map(seatID => this.room.getPlayerBySeatID(seatID, true));
                        if (!this.cardSelectCorrectly(card, selected))
                            throw new Error('select card incorrectly');
                        let targets: Player[];
                        if (typeof cardClass.filterTarget == 'function') {
                            targets = cardClass.filterTarget(card, this, selected);
                        } else {
                            targets = selected.slice();
                        }
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: true,
                            cardIDs: [data.cardID],
                            targets: data.selected,
                        });
                        this.room.endAsk();
                        await this.useCard(card, selected, targets);
                        await this.askPlayCard();
                        resolve();
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public askDiscard(askingName: string, param: { maxCount: number, minCount: number, extra?: any }): Promise<void> {
        return new Promise((resolve, reject) => {
            this.room.beginAsk(AskingType.Discard, askingName, this, async () => {
                if (this.alive)
                    resolve(await this.askDiscard(askingName, param));
                else
                    resolve();
            });
            let p = {
                maxCount: param.maxCount,
                minCount: param.minCount,
            };
            Object.assign(p, param.extra);
            this.room.askingParam = this.room.makeAskingParam(AskingType.Discard, askingName, p);
            this.room.sockets.emit('ask discard', {
                seatID: this.seatID,
                askingName,
                param: p,
            });
            let listeners = [
                {
                    player: this,
                    eventName: 'discard',
                    listener: async (cardIDs: number[]) => {
                        cardIDs = Util.removeRepeat(cardIDs);
                        let cards = this.room.getCardsByID(cardIDs);
                        if (cards.length < this.room.askingParam.minCardCount(this))
                            throw new Error('need more cards');
                        if (cards.length > this.room.askingParam.maxCardCount(this))
                            throw new Error('too many cards');
                        for (let i = 0; i < cards.length; i++) {
                            let selectedCards = cards.slice(0, i);
                            let unselectedCards = this.hand.filter(card => !selectedCards.includes(card));
                            if (!this.room.askingParam.filterCard(this, selectedCards, unselectedCards).includes(cards[i]))
                                throw new Error('select cards incorrectly');
                        }
                        this.room.endAsk();
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: true,
                            cardIDs,
                        });
                        await this.discard(cards);
                        resolve();
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public askRespondCard(askingName: string, param: { cardClassName?: string, cause?: Card, extra?: any }): Promise<Card | undefined> {
        return new Promise(async (resolve, reject) => {
            let p: any = {};
            if (param.cardClassName)
                p.cardClassName = param.cardClassName;
            Object.assign(p, param.extra);
            let askingParam = this.room.makeAskingParam(AskingType.RespondCard, askingName, p);
            if (!askingParam.cardClassName)
                throw new Error('missing cardClassName');
            if (param.cause && !this.canAnswerCard(param.cause, askingParam.cardClassName)) {
                resolve();
                return;
            }
            //---- event NeedRespondCard
            let card = await this.room.events.emit(GameEvent.NeedRespondCard, askingParam.cardClassName, this);
            if (card) {
                resolve(card);
                return;
            }
            //----
            this.room.beginAsk(AskingType.RespondCard, askingName, this, async () => {
                if (this.alive)
                    resolve(await this.askRespondCard(askingName, param));
                else
                    resolve();
            });
            this.room.askingParam = askingParam;
            this.room.sockets.emit('ask respond card', {
                seatID: this.seatID,
                askingName,
                param: p,
            });
            let listeners = [
                {
                    player: this,
                    eventName: 'do not respond card',
                    listener: () => {
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: false,
                        });
                        this.room.endAsk();
                        resolve();
                    },
                },
                {
                    player: this,
                    eventName: 'respond card',
                    listener: async (data: { cardID?: number, skill: string, skillParam: any }) => {
                        let card: Card | undefined;
                        if (typeof data.cardID == 'undefined') {
                            card = await this.respondBySkill(data.skill, data.skillParam);
                            if (!card)
                                return;
                        } else {
                            card = this.room.getCardByID(data.cardID);
                            if (this.hand.every(e => e != card))
                                throw new Error('select card incorrectly');
                        }
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: true,
                            cardIDs: [data.cardID],
                        });
                        this.room.endAsk();
                        await this.respondCard(card);
                        resolve(card);
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public askUseCard(askingName: string, param: { cardClassName?: string, targets: Player[], cause?: Card, extra?: any }): Promise<Card | void>;
    public askUseCard(askingName: string, param: { cardClassName?: string, targets: Card, cause?: Card, extra?: any }): Promise<{ card?: Card; ret?: boolean }>;
    public askUseCard(askingName: string, param: { cardClassName?: string, targets: Player[] | Card, cause?: Card, extra?: any }): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let seatIDs: number[] = param.targets instanceof Card ? [] : param.targets.map(e => e.seatID);
            let p: any = {
                targets: seatIDs,
            };
            if (param.cardClassName)
                p.cardClassName = param.cardClassName;
            Object.assign(p, param.extra);
            let askingParam = this.room.makeAskingParam(AskingType.UseCard, askingName, p);
            if (!askingParam.cardClassName)
                reject(new Error('missing cardClassName'));
            if (param.cause && !this.canAnswerCard(param.cause, askingParam.cardClassName)) {
                if (param.targets instanceof Card)
                    resolve({});
                else
                    resolve();
                return;
            }
            //---- event NeedUseCard
            let card = await this.room.events.emit(GameEvent.NeedUseCard, askingParam.cardClassName, this, param.targets);
            if (card) {
                if (param.targets instanceof Card) {
                    let ret = await this.useCard(card, [], param.targets);
                    resolve({ card, ret });
                } else {
                    await this.useCard(card, param.targets, param.targets);
                    resolve({ card });
                }
                return;
            }
            //----
            this.room.beginAsk(AskingType.UseCard, askingName, this, async () => {
                if (this.alive)
                    resolve(await this.askUseCard(askingName, param as any));
                else
                    resolve();
            });
            this.room.askingParam = askingParam;
            this.room.sockets.emit('ask use card', {
                seatID: this.seatID,
                askingName,
                param: p,
            });
            let listeners = [
                {
                    player: this,
                    eventName: 'do not use card',
                    listener: () => {
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: false,
                        });
                        this.room.endAsk();
                        if (param.targets instanceof Card)
                            resolve({});
                        else
                            resolve();
                    },
                },
                {
                    player: this,
                    eventName: 'use card',
                    listener: async (data: { cardID?: number, skill: string, skillParam: any }) => {
                        let card: Card | undefined;
                        if (typeof data.cardID == 'undefined') {
                            card = await this.respondBySkill(data.skill, data.skillParam);
                            if (!card)
                                return;
                        } else {
                            card = this.room.getCardByID(data.cardID);
                            if (this.hand.every(e => e != card))
                                throw new Error('select card incorrectly');
                        }
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: true,
                            cardIDs: [data.cardID],
                        });
                        this.room.endAsk();
                        if (param.targets instanceof Card) {
                            let ret = await this.useCard(card, [], param.targets);
                            resolve({ card, ret });
                        } else {
                            await this.useCard(card, param.targets, param.targets);
                            resolve(card);
                        }
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public askSelectCardsInWindow(askingName: string, { cardCount, cards, extra }: { cardCount?: number, cards: Card[], extra?: any }): Promise<Card[]> {
        return new Promise((resolve, reject) => {
            let p: any = {
                cardIDs: Game.getCardIDs(cards),
                classNames: cards.filter(card => card.virtual).map(card => card.class.name),
            };
            if (cardCount)
                p.cardCount = cardCount;
            Object.assign(p, extra);
            let askingParam = this.room.makeAskingParam(AskingType.SelectCardInWindow, askingName, p);
            if (!askingParam.cardCount)
                throw new Error('missing cardCount');
            this.room.beginAsk(AskingType.SelectCardInWindow, askingName, this, async () => {
                if (this.alive)
                    resolve(await this.askSelectCardsInWindow(askingName, { cardCount, cards, extra }));
                else
                    resolve();
            });
            this.room.askingParam = askingParam;
            let data = {
                seatID: this.seatID,
                askingName,
                param: p,
            };
            this.room.sockets.emit('ask select cards in window', data);
            let listeners = [
                {
                    player: this,
                    eventName: 'select cards',
                    listener: (data: { cardIDs: number[], classNames: string[] }) => {
                        data.cardIDs = [
                            ...Util.removeRepeat(data.cardIDs.filter(cardID => cardID != 0)),
                            ...data.cardIDs.filter(cardID => cardID == 0),
                        ];
                        if (!Array.isArray(data.cardIDs))
                            throw Error('cardIDs type error');
                        if (data.cardIDs.length != this.room.askingParam.cardCount) {
                            throw new Error('cards count does not match');
                        }
                        let i = 0;
                        let unknownCardsCount = cards.filter(card => card == this.room.unknownCard).length;
                        let selectedUnknownCardsCount = 0;
                        let selectedCards = data.cardIDs.map(cardID => {
                            if (cardID == 0) {
                                let className = data.classNames[i++];
                                if (!className) {
                                    selectedUnknownCardsCount++;
                                    return this.room.unknownCard;
                                }
                                let card = cards.find(card => card.virtual && card.class.name == className);
                                if (card) {
                                    return card;
                                } else {
                                    throw new Error('className error');
                                }
                            } else {
                                let card = this.room.getCardByID(cardID);
                                if (!cards.includes(card))
                                    throw new Error('select card incorrectly');
                                return card;
                            }
                        });
                        if (selectedUnknownCardsCount > unknownCardsCount)
                            throw new Error('too many unknownCards');
                        //TODO:hide
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: true,
                            cardIDs: data.cardIDs,
                        });
                        this.room.endAsk();
                        resolve(selectedCards);
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public askSelectGlobalCardInWindow(): Promise<Card> {
        return new Promise((resolve, reject) => {
            if (this.room.globalCards.length == 1) {
                resolve(this.room.globalCards.splice(0, 1)[0]);
                return;
            }
            this.room.beginAsk(AskingType.SelectGlobalCardInWindow, '', this, async () => {
                if (this.alive)
                    resolve(await this.askSelectGlobalCardInWindow());
                else
                    resolve();
            });
            this.room.players.forEach(player => {
                if (player == this)
                    player.socket.emit('set global cards window title', `${this.room.globalCardsWindowFirstTitle} 请选一张卡牌`);
                else
                    player.socket.emit('set global cards window title', `${this.room.globalCardsWindowFirstTitle} 等待${this.name}选牌`);
            });
            this.room.sockets.emit('ask select global card in window', {
                seatID: this.seatID,
            });
            let listeners = [
                {
                    player: this,
                    eventName: 'select card',
                    listener: (cardID: number) => {
                        let card = this.room.getCardByID(cardID);
                        if (this.room.globalCards.every(e => e != card))
                            throw new Error('select card incorrectly');
                        let i = this.room.globalCards.indexOf(card);
                        this.room.globalCards.splice(i, 1);
                        this.room.sockets.emitAI('asking response', {
                            seatID: this.seatID,
                            ok: true,
                            cardIDs: [cardID],
                        });
                        this.room.endAsk();
                        this.room.sockets.emit('global card selected', {
                            seatID: this.seatID,
                            cardID,
                        });
                        resolve(card);
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public askUseSkill(skillName: string, param?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.room.beginAsk(AskingType.UseSkill, skillName, this, async () => {
                if (this.alive)
                    resolve(await this.askUseSkill(skillName, param));
                else
                    resolve();
            });
            let data = {
                seatID: this.seatID,
                skillName,
            };
            if (typeof param != 'undefined') {
                for (let k of Object.keys(param)) {
                    if (Array.isArray(param[k]) && param[k].length > 0) {
                        if (param[k][0] instanceof Player)
                            param[k] = param[k].map((e: Player) => e.seatID);
                    } else if (param[k] instanceof Player) {
                        param[k] = param[k].seatID;
                    }
                }
                Object.assign(data, { param });
            }
            this.room.askingParam = param;
            let skill = this.skills.find(skill => skill.name == skillName) || Game.getSkill(skillName);
            this.room.sockets.emit('ask use skill', data);
            let listeners = [
                {
                    player: this,
                    eventName: 'use skill',
                    listener: (response: any) => {
                        if (!response)
                            return;
                        this.formatSkillParam(skill, response.skillParam);
                        this.room.endAsk();
                        if (typeof response.skillParam == 'undefined')
                            resolve(true);
                        else
                            resolve(response.skillParam);
                    },
                },
                {
                    player: this,
                    eventName: 'do not use skill',
                    listener: () => {
                        if (!skill.cancel)
                            return;
                        this.room.endAsk();
                        resolve(false);
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public askSelectSuit(askingName: string, { suits, extra }: { suits?: Suit[], extra?: any } = {}): Promise<Suit> {
        return new Promise((resolve, reject) => {
            this.room.beginAsk(AskingType.SelectSuit, askingName, this, async () => {
                if (this.alive)
                    resolve(await this.askSelectSuit(askingName, { suits, extra }));
                else
                    resolve();
            });
            if (!suits)
                suits = [Suit.Heart, Suit.Diamond, Suit.Spade, Suit.Club];
            let p = {
                suits,
            };
            Object.assign(p, extra);
            this.room.askingParam = this.room.makeAskingParam(AskingType.SelectSuit, askingName, p);
            this.room.sockets.emit('ask select suit', {
                seatID: this.seatID,
                askingName,
                param: p,
            });
            let listeners = [
                {
                    player: this,
                    eventName: 'select suit',
                    listener: async (suit: Suit) => {
                        if (!this.room.askingParam.suits.includes(suit)) return;
                        this.room.endAsk();
                        this.room.sockets.emitAI('select suit', {
                            seatID: this.seatID,
                            ok: true,
                            suit,
                        });
                        resolve(suit);
                    },
                },
            ];
            this.room.setAskingListeners(listeners, reject);
        });
    }
    public playEffect(name: string, pos: EffectPosition = EffectPosition.General) {
        this.socket.emit('play effect', {
            seatID: this.seatID,
            name,
            pos,
        });
    }
}
export default Player;
