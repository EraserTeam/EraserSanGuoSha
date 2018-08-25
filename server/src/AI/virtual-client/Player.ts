import AskingType from '../../AskingType';
import Card from '../../Card';
import CardType from '../../CardType';
import EquipType from '../../EquipType';
import Game from '../../Game';
import { GameSyncEvent } from '../../GameEvent';
import Identity from '../../Identity';
import Skill from '../../Skill';
import Room from './Room';
class Player {
    public room: Room;
    public hand: Card[] = [];
    public judgeZone: Card[] = [];
    public equipZone: Array<Card | undefined> = [undefined, undefined, undefined, undefined];
    public seatID!: number;
    public seatNum!: number;
    public maxHP!: number;
    public HP!: number;
    public alive: boolean = true;
    public identity: Identity = Identity.Unknown;
    public back: boolean = false;
    public skills: Skill[] = [];
    protected flag: any = {};
    constructor(room: Room) {
        this.room = room;
    }
    protected get self() {
        return false;
    }
    public addHandCards(cards: Card[]) {
        this.hand.push(...cards);
    }
    public removeHandCards(cards: Card[]) {
        if (this.self)
            this.hand = this.hand.filter(e => !cards.includes(e));
        else
            this.hand.splice(0, cards.length);
    }
    public addToJudgeZone(cards: Card[]) {
        this.judgeZone.push(...cards);
    }
    public removeFromJudgeZone(cards: Card[]) {
        cards.forEach(card => {
            let i = this.judgeZone.indexOf(card);
            if (~i)
                this.judgeZone.splice(i, 1);
        });
    }
    public setEquip(equipType: EquipType, card: Card | undefined) {
        this.equipZone[equipType] = card;
    }
    public hasEquipType(equipType: EquipType): boolean {
        return typeof this.equipZone[equipType] != 'undefined';
    }
    public hasEquip(equipClass: string): boolean {
        return this.equipZone.some(card => !!(card && card.class.name == equipClass));
    }
    public hasCardClassInJudgeZone(cardClass: string): boolean {
        return this.judgeZone.some(card => card.class.name == cardClass);
    }
    public getSkill(skill: Skill): void;
    public getSkill(skillName: string): void;
    public getSkill(skill: Skill | string) {
        if (typeof skill == 'string')
            skill = new Skill(skill);
        if (this.hasSkill(skill.name))
            return;
        this.skills.push(skill);
    }
    public hasSkill(skillName: string) {
        let hasSkill = this.skills.some(skill => skill.name == skillName);
        if (hasSkill)
            return true;
        return this.room.syncEvents.emit(GameSyncEvent.HasSkill, this, skillName);
    }
    public syncUseSkill() {} // empty
    public get hasCard(): boolean {
        return this.hand.length > 0 || this.equipZoneCards.length > 0;
    }
    public get hasZoneCard(): boolean {
        return this.hand.length > 0 || this.equipZoneCards.length > 0 || this.judgeZone.length > 0;
    }
    public getFlag(key: string): any {
        return this.flag[key];
    }
    public setFlag(key: string, value: any) {
        this.flag[key] = value;
    }
    public get equipZoneCards(): Card[] {
        return this.equipZone.filter(card => card) as Card[];
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
        if (!arm)
            return 1;
        else {
            let attackRange = arm.class.attackRange;
            if (typeof attackRange == 'undefined')
                attackRange = 1;
            return attackRange;
        }
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
    public extraMaxTargetCount(card: Card): number {
        let n = 0;
        this.room.syncEvents.callbackEmit(GameSyncEvent.CalcExtraMaxTargetCount, listener => {
            let ret = listener(this, card, n);
            if (typeof ret != 'undefined')
                n = ret;
        });
        return n;
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
        return card.class.filterSelect(card, this as any, selected as any[], players as any[]) as any;
    }
    public cardSelectCorrectly(card: Card, selected: Player[]): boolean {
        for (let player of selected) {
            if (!player.alive) return false;
            if (card.class.type == CardType.Bag && card.class.delay && player.hasCardClassInJudgeZone(card.class.name)) return false;
        }
        let players = this.room.alivePlayers;
        for (let i = 0; i < selected.length - 1; i++) {
            let currentSelected = selected.slice(0, i);
            let targets = players.filter(player => !currentSelected.includes(player));
            if (!this.cardFilterSelect(card, currentSelected, targets).includes(selected[i]))
                return false;
        }
        return card.class.selectCorrectly(card, this as any, selected as any[]);
    }
    public cardEnabled(card: Card) {
        return card.class.enabled(card, this as any);
    }
    protected makeAskingParam(askingType: AskingType, askingName: string, param?: any): any {
        let askingParam = Object.assign({}, Game.getAskingTypeContents(askingType));
        if (askingType != AskingType.UseSkill) {
            let asking = Game.getAsking(askingName);
            Object.assign(askingParam, asking && asking.param);
        }
        Object.assign(askingParam, param);
        return askingParam;
    }
    protected initAskingParam(param?: any) {
        this.room.askingParam = this.makeAskingParam(this.room.askingType, this.room.askingName, param);
    }
    public async askPlaycard() {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.PlayCard;
        this.room.askingName = '';
        this.initAskingParam();
        if (!this.self) {
            this.endAsk();
        }
    }
    public askDiscard(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.Discard;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        if (!this.self) {
            this.endAsk();
        }
    }
    public askRespondCard(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.RespondCard;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        if (!this.self) {
            this.endAsk();
        }
    }
    public async askUseCard(askingName: string, param: any, multiplayer = false) {
        if (this.self && this.room.extraEndAskCount > 0) {
            this.room.extraEndAskCount--;
            return false;
        }
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.UseCard;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        this.room.askingParam.multiplayer = multiplayer;
        if (!this.self) {
            this.endAsk();
        }
        if (multiplayer) {
            this.room.extraEndAskCount--;
        }
        return true;
    }
    public async askSelectCardsInWindow(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.SelectCardInWindow;
        this.room.askingName = askingName;
        this.initAskingParam(param);
        if (!this.self) {
            this.endAsk();
        }
    }
    public async askSelectGlobalCardInWindow() {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.SelectGlobalCardInWindow;
        this.room.askingName = '';
        if (!this.self) {
            this.endAsk();
        }
    }
    public askUseSkill(skillName: string, param?: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.UseSkill;
        this.room.askingSkillName = skillName;
        this.initAskingParam(param);
    }
    public askSelectSuit(askingName: string, param: any) {
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.SelectSuit;
        this.room.askingName = askingName;
        this.initAskingParam(param);
    }
    public endAsk() {
        if (this.self && this.room.askingType == AskingType.None) {
            this.room.extraEndAskCount++;
        }
        this.room.askPlayers = [this];
        this.room.askingType = AskingType.None;
        this.room.askingName = '';
        this.room.askingParam = undefined;
    }
}

export default Player;
