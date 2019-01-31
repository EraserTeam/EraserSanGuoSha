import AIServerSocket from './AI/AIServerSocket';
import AIUser from './AI/AIUser';
import AskingType from './AskingType';
import Card from './Card';
import Game from './Game';
import GameEarlierEvent from './GameEarlierEvent';
import GameEarlierEventEmitter from './GameEarlierEventEmitter';
import GameEvent from './GameEvent';
import GameEventEmitter, { GameSyncEventEmitter } from './GameEventEmitter';
import Identity from './Identity';
import IGeneral from './IGeneral';
import IMoveCardInfo from './IMoveCardInfo';
import IUser from './IUser';
import Pile from './Pile';
import Player from './Player';
import Predefined from './Predefined';
import RequireType from './RequireType';
import Round from './Round';
import { Sockets } from './Socket';
import Suit from './Suit';
import User from './User';
import * as Util from './Util';
import Zone from './Zone';
class Room {
    public static all: Room[] = [];
    private static idRange: number[] = Util.getRangeArr(1, 9999);
    public id: number = 0;
    public users: IUser[] = [];
    public sockets!: Sockets;
    public cardIDs!: Set<number>;
    public cards: Card[] = [];
    public unknownCard: Card = new Card(this, Game.unknownCard);
    public cardPile: Pile = new Pile();
    public discardPile: Pile = new Pile();
    public disposeZone: Pile = new Pile();
    public maxPlayerCount: number = 2;
    public players: Player[] = [];
    public rounds: Round[] = [];
    private _roundIndex: number = -1;
    public askPlayers!: Player[];
    public askingType: AskingType = AskingType.None;
    public askingName: string = '';
    public askingParam: any;
    public restartAsking: () => any = () => { };
    public askingListeners: AskingListeners = [];
    public events = new GameEventEmitter();
    public syncEvents!: GameSyncEventEmitter;
    public earlierEvents!: GameEarlierEventEmitter;
    public globalCardsWindowFirstTitle!: string;
    public globalCards: Card[] = []; //五谷丰登亮出的牌
    private modeName: string = 'StandardIdentityMode';
    private includedComponent: any = {};
    private isIncludingMode: boolean = false;
    public identitiesGuess: Identity[] = [];
    public virtual: boolean;
    private allRandom: number[] = [];
    private randomIndex: number = 0;
    private restart: boolean;
    constructor(virtual = false, restart = true) {
        this.virtual = virtual;
        this.restart = restart;
        if (virtual)
            return;
        Room.all.push(this);
        let random = Util.random(0, Room.idRange.length - 1);
        this.id = Room.idRange[random];
        Room.idRange.splice(random, 1);
    }
    public static delete(room: Room) {
        let i = Room.all.indexOf(room);
        if (~i) {
            Room.all.splice(i, 1);
            Room.idRange.push(room.id);
        }
        [...room.users].forEach(user => {
            if (user instanceof User) {
                user.leaveRoom();
            }
        });
    }
    public static getRoom(id: number): Room | undefined {
        return Room.all.find(room => room.id == id);
    }
    public get playerCount(): number {
        return this.users.length;
    }
    public initSockets() {
        if (this.sockets)
            this.sockets.clearListeners();
        this.sockets = new Sockets(this.players);
        this.players.forEach(player => {
            player.initSocket();
        });
    }
    public async catchError(e: Error) {
        if (e.message == 'game end') {
            if (this.users.length >= this.maxPlayerCount) {
                await this.beginGame();
            }
        } else throw e;
    }
    public initEvents() {
        this.includedComponent = {};
        this.events = new GameEventEmitter();
        this.syncEvents = new GameSyncEventEmitter();
        this.earlierEvents = new GameEarlierEventEmitter();
        this.cardIDs = new Set<number>();
        Predefined.initEvents(this);
        this.require(RequireType.Package, 'predefined');
        this.require(RequireType.Mode, this.modeName);
    }
    public require(type: RequireType, name: string): any;
    public require(arr: Array<{ type: RequireType, name: string }>): any;
    public require(type: RequireType | Array<{ type: RequireType, name: string }>, name?: any) {
        if (Array.isArray(type)) {
            type.forEach((e) => {
                this.require(e.type, e.name);
            });
            return;
        }
        if (this.includedComponent[type] && this.includedComponent[type][name])
            return;
        let elements: any;
        switch (type) {
            case RequireType.Package:
                elements = Game.packages;
                break;
            case RequireType.CardClass:
                elements = Game.cardClasses;
                break;
            case RequireType.Skill:
                elements = Game.skills;
                break;
            case RequireType.General:
                elements = Game.generals;
                break;
            case RequireType.Mode:
                elements = Game.modes;
                break;
            default:
                return;
        }
        let element = elements[name];
        if (!element)
            throw new Error(`${RequireType[type]} "${name}" does not exist.`);
        if (type == RequireType.Package) {
            for (let cardClassFullName of Object.keys(element.cardClasses)) {
                this.require(RequireType.CardClass, cardClassFullName);
            }
            for (let skillName of Object.keys(element.skills)) {
                this.require(RequireType.Skill, skillName);
            }
            for (let generalName of Object.keys(element.generals)) {
                this.require(RequireType.General, generalName);
            }
        } else {
            if (type == RequireType.Mode && element.abstract && !this.isIncludingMode)
                throw new Error(`An abstract mode "${name}" can only be included by a mode.`);
            if (type == RequireType.General) {
                element.skills.forEach((skillName: string) => {
                    this.require(RequireType.Skill, skillName);
                });
            }
            if (typeof element.init != 'undefined') {
                let temp = this.isIncludingMode;
                this.isIncludingMode = type == RequireType.Mode;
                element.init(this);
                this.isIncludingMode = temp;
            }
        }
        this.includedComponent[type] = this.includedComponent[type] || {};
        this.includedComponent[type][name] = element;
    }
    public initGenerals() {
        let generals: IGeneral[] = Object.values(this.includedComponent[RequireType.General]);
        this.players.forEach(player => {
            let general = generals[Util.random(0, generals.length - 1)];
            player.general = general;
            player.setAlive(true);
            player.setMaxHP(general.HP);
            player.setHP(general.HP);
            general.skills.forEach(skill => !Game.getSkill(skill).emperor && player.getSkill(skill));
        });
    }
    public get round(): Round {
        return this.rounds[this.roundIndex];
    }
    public get roundIndex(): number {
        return this._roundIndex;
    }
    public set roundIndex(index: number) {
        this._roundIndex = index;
        this.sockets.emit('set round', {
            seatID: this.round.player.seatID,
        });
    }
    public get alivePlayers(): Player[] {
        return this.players.filter(player => player.alive);
    }
    public initRounds() {
        this._roundIndex = -1;
        this.rounds = [];
        for (let i = 1; i <= this.playerCount; i++) {
            let player = this.getPlayerBySeatNum(i);
            if (player.alive) {
                this.rounds.push(new Round(player));
            }
        }
    }
    public async nextRound(skip: boolean = false) {
        if (this.round && !skip)
            await this.events.emit(GameEvent.AfterRoundEnd, this.round.player);
        let i = this.roundIndex + 1;
        let bool: boolean = false;
        for (; i < this.rounds.length; i++) {
            if (this.rounds[i].player.alive) {
                bool = true;
                break;
            }
        }
        if (bool) {
            this.roundIndex = i;
        } else {
            this.initRounds();
            this.roundIndex = 0;
        }
        if (this.round.player.back) {
            await this.round.player.turnover();
            await this.nextRound(true);
        } else {
            await this.round.begin();
        }
    }
    public async moveCards(param: IMoveCards | IMoveCards[]) {
        let obj: any = {};
        if (!Array.isArray(param))
            param = [param];
        let virtualInfo;
        param.forEach(param => {
            virtualInfo = this.initMoveCards(param);
            let ret = this.classifyCardsByPosition(param.cards);
            for (let fromSeatID of Object.keys(ret))
                for (let fromZone of Object.keys(ret[fromSeatID])) {
                    obj[fromSeatID] = obj[fromSeatID] || {};
                    obj[fromSeatID][fromZone] = obj[fromSeatID][fromZone] || {};
                    obj[fromSeatID][fromZone][param.toSeatID as number] = obj[fromSeatID][fromZone][param.toSeatID as number] || {};
                    obj[fromSeatID][fromZone][param.toSeatID as number][param.toZone] = ret[fromSeatID][fromZone];
                }
        });

        let info = this.makeMoveCardInfo(obj);
        await this.events.emit(GameEvent.BeforeMoveCard, info);
        for (let fromSeatID of Object.keys(obj))
            for (let fromZone of Object.keys(obj[fromSeatID]))
                for (let toSeatID of Object.keys(obj[fromSeatID][fromZone]))
                    for (let toZone of Object.keys(obj[fromSeatID][fromZone][toSeatID])) {
                        let cards = obj[fromSeatID][fromZone][toSeatID][toZone];
                        this.moveCardsFromSameZone(cards, +toSeatID, +toZone, virtualInfo);
                    }
        await this.events.emit(GameEvent.AfterMoveCard, info);
    }
    private initMoveCards(param: IMoveCards) {
        if (typeof param.fromSeatID == 'undefined') {
            param.fromSeatID = -1;
        }
        if (typeof param.toSeatID == 'undefined') {
            param.toSeatID = -1;
        }

        param.cards = param.cards.filter(card =>
            (typeof param.fromZone == 'undefined' || card.zone == param.fromZone) &&
            (param.fromSeatID == -1 || card.seatID == param.fromSeatID),
        );

        if (param.cards.length == 0) return;
        if (param.toZone == Zone.Hand || param.toZone == Zone.Judge || param.toZone == Zone.Equip) {
            if (param.toSeatID < 0 || param.toSeatID >= this.players.length) {
                throw new Error(`toSeatID ${param.toSeatID} does not exist`);
            }
        }

        //移动一张虚拟牌是指移动此虚拟牌对应的实体牌
        let virtualInfo: any = {};
        let len = param.cards.length;
        for (let i = 0; i < len; i++) {
            let card = param.cards[i];
            if (card.virtual) {
                param.cards.push(...card.realCards);
            }
        }
        return virtualInfo;
    }
    private classifyCardsByPosition(cards: Card[]): any {
        let obj: any = {};
        cards.forEach(card => {
            obj[card.seatID] = obj[card.seatID] || {};
            obj[card.seatID][card.zone] = obj[card.seatID][card.zone] || [];
            obj[card.seatID][card.zone].push(card);
        });
        return obj;
    }
    private moveCardsFromSameZone(cards: Card[], toSeatID: number, toZone: Zone, virtualInfo: any) {
        let [fromSeatID, fromZone] = [cards[0].seatID, cards[0].zone];
        let realCards = cards.filter(card => !card.virtual);
        if (fromZone == Zone.Hand) {
            this.players[fromSeatID].hand.remove(cards);
        } else if (fromZone == Zone.CardPile) {
            this.cardPile.remove(cards);
            this.shuffleTest();
        } else if (fromZone == Zone.DiscardPile) {
            this.discardPile.remove(cards);
        } else if (fromZone == Zone.Dispose) {
            this.disposeZone.remove(cards);
        } else if (fromZone == Zone.Judge) {
            this.players[fromSeatID].judgeZone.remove(cards);
        } else if (fromZone == Zone.Equip) {
            let player = this.players[fromSeatID];
            cards.forEach(card => {
                if (typeof card.class.equipType == 'undefined') return;
                player.equipZone[card.class.equipType] = undefined;
            });
        }
        if (toZone == Zone.Hand) {
            this.players[toSeatID].hand.add(realCards);
        } else if (toZone == Zone.CardPile) {
            this.cardPile.add(realCards);
        } else if (toZone == Zone.DiscardPile) {
            this.discardPile.add(realCards);
        } else if (toZone == Zone.Dispose) {
            this.disposeZone.add(realCards);
        } else if (toZone == Zone.Judge) {
            let virtualCards = cards.filter(card => card.virtual);
            let commonCards = realCards.filter(card => virtualCards.every(virtualCard => !virtualCard.realCards.includes(card)));
            this.players[toSeatID].judgeZone.add([...virtualCards, ...commonCards]);
        } else if (toZone == Zone.Equip) {
            let player = this.players[toSeatID];
            cards.forEach(card => {
                if (typeof card.class.equipType == 'undefined') return;
                player.equipZone[card.class.equipType] = card;
            });
        }
        cards.forEach(card => {
            card.zone = toZone;
            card.seatID = toSeatID;
        });

        if (toZone == Zone.Hand && fromZone != Zone.Dispose && fromZone != Zone.Judge && fromZone != Zone.Equip) {
            this.players.forEach(player => {
                player.socket.emit('move card', {
                    fromSeatID,
                    toSeatID,
                    fromZone,
                    toZone,
                    cardIDs: Game.getCardIDs(player.seatID == toSeatID || player.seatID == fromSeatID ? cards.filter(card => !card.virtual) : this.makeUnknownCards(cards.length)),
                });
            });
        } else if (toZone == Zone.Judge || fromZone == Zone.Judge) {
            let virtualCards = cards.filter(card => card.virtual);
            let commonCards = realCards.filter(card => virtualCards.every(virtualCard => !virtualCard.realCards.includes(card)));
            this.sockets.emit('move card', {
                fromSeatID,
                toSeatID,
                fromZone,
                toZone,
                cardIDs: Game.getCardIDs(commonCards),
                virtualCardsInfo: virtualCards.map(virtualCard => ({
                    className: virtualCard.class.name,
                    cardIDs: Game.getCardIDs(virtualCard.realCards),
                })),
            });
        } else {
            this.sockets.emit('move card', {
                fromSeatID,
                toSeatID,
                fromZone,
                toZone,
                cardIDs: Game.getCardIDs(cards.filter(card => !card.virtual)),
            });
        }
    }
    private makeMoveCardInfo(obj: any): IMoveCardInfo[] {
        let arr: IMoveCardInfo[] = [];
        for (let fromSeatID of Object.keys(obj))
            for (let fromZone of Object.keys(obj[fromSeatID]))
                for (let toSeatID of Object.keys(obj[fromSeatID][fromZone]))
                    for (let toZone of Object.keys(obj[fromSeatID][fromZone][toSeatID])) {
                        let cards: Card[] = obj[fromSeatID][fromZone][toSeatID][toZone];
                        cards.forEach(card => {
                            if (card.virtual)
                                return;
                            arr.push({
                                fromPlayer: this.players[+fromSeatID],
                                toPlayer: this.players[+toSeatID],
                                fromZone: +fromZone,
                                toZone: +toZone,
                                card,
                            });
                        });
                    }
        return arr;
    }
    public beginAsk(status: AskingType, askingName: string, players: Player | Player[], restartAsking: () => void) {
        this.askingType = status;
        if (!Array.isArray(players)) {
            players = [players];
        }
        this.askPlayers = players;
        this.restartAsking = restartAsking;
    }
    public endAsk() {
        this.askingType = AskingType.None;
        this.askPlayers = undefined as any;
        this.askingName = '';
        this.askingParam = undefined;
        this.askingListeners.forEach(element => {
            element.player.socket.removeListener(element.eventName, element.listener);
        });
        this.askingListeners = [];
        this.restartAsking = () => { };
    }
    public async cardEffect(card: Card, source: Player | undefined, selected: Player[], targets: Player[], target?: Player): Promise<boolean> {
        let callback = await this.events.emit(GameEvent.$BeforeCallCardEffect, card, source, selected, targets, target);
        let ret = await (async () => {
            let cardClass = card.class;
            let ret = await this.events.emit(GameEvent.BeforeCardEffect, card, source, selected, targets, target);
            let effect: boolean = false;
            let counteractingCard: Card | undefined;
            if (typeof ret == 'undefined') {
                effect = true;
            } else if (ret.effect === false && ret.counteractingCard instanceof Card) {
                counteractingCard = ret.counteractingCard;
            } else {
                effect = ret;
            }
            if (!effect) {
                let effect = await this.events.emit(GameEvent.CardBeCounteracted, source, card, selected, targets, target, counteractingCard);
                if (!effect) return false;
            }
            await this.events.emit(GameEvent.CardEffect, card, source, selected, targets, target);
            if (typeof cardClass.effect != 'undefined') {
                let effect = await cardClass.effect(card, source, selected, targets, target);
                if (typeof effect == 'undefined') effect = true;
                return effect;
            }
            return false;
        })();
        if (callback)
            await callback();
        return ret;
    }
    public getCardPileTopCards(n: number) {
        this.shuffleTest(n);
        let cards = this.cardPile.slice(-n).reverse();
        return cards;
    }
    public getCardPileTopCard() {
        return this.getCardPileTopCards(1)[0];
    }
    public random = (a: number, b: number) => {
        let random;
        if (this.randomIndex == this.allRandom.length) {
            this.allRandom[this.randomIndex] = random = Util.random(a, b);
        } else {
            random = this.allRandom[this.randomIndex];
        }
        this.randomIndex++;
        return random;
    }
    public shuffle() {
        let pile = new Pile();
        pile.set(this.discardPile.splice(0));
        pile.shuffle(this.random);
        pile.add(this.cardPile);
        this.cardPile.set(pile);
        this.cardPile.forEach(card => card.zone = Zone.CardPile);
        this.sockets.emit('shuffle');
    }
    public shuffleTest(n?: number) {
        if (typeof n == 'number') {
            if (this.cardPile.length < n) {
                this.shuffle();
            }
        } else {
            if (this.cardPile.length == n) {
                this.shuffle();
            }
        }
    }
    public async lighten(zone: Zone, n: number): Promise<Card[]> {
        if (zone == Zone.CardPile) {
            let cards = this.getCardPileTopCards(n);
            await this.moveCards({
                fromZone: zone,
                toZone: Zone.Dispose,
                cards,
            });
            return cards;
        }
        return [];
    }
    public setAskingListeners(listeners: AskingListeners, reject: (reason?: any) => void) {
        this.askingListeners = listeners;
        listeners.forEach(element => {
            element.player.socket.on(element.eventName, element.listener, reject);
        });
    }
    public makeAskingParam(askingType: AskingType, askingName: string, param?: any): any {
        let askingParam = Object.assign({}, Game.getAskingTypeContents(askingType));
        if (askingType != AskingType.UseSkill) {
            let asking = Game.getAsking(askingName);
            Object.assign(askingParam, asking && asking.param);
        }
        Object.assign(askingParam, param);
        return askingParam;
    }
    public askUseCard(askingName: string, param: { cardClassName?: string, targets: Player[] | Card, cause?: Card, extra?: any }): Promise<{ player?: Player; card?: Card; ret?: boolean }> {
        return new Promise(async (resolve, reject) => {
            let seatIDs: number[] | undefined = param.targets instanceof Card ? [] : param.targets.map(e => e.seatID);
            let p: any = {
                targets: seatIDs,
            };
            if (param.cardClassName)
                p.cardClassName = param.cardClassName;
            Object.assign(p, param.extra);
            let askingParam = this.makeAskingParam(AskingType.UseCard, askingName, p);
            if (!askingParam.cardClassName)
                throw new Error('missing cardClassName');
            let players = this.alivePlayers;
            players = Game.sortPlayersBySeatNum(players, this.round.player);
            //---- event NeedUseCard
            for (let player of players) {
                let card = await this.events.emit(GameEvent.NeedUseCard, askingParam.cardClassName, player, param.targets);
                if (!card) continue;
                let ret = await player.useCard(card, [], param.targets);
                resolve({
                    player,
                    card,
                    ret,
                });
                return;
            }
            //----
            if (param.cause)
                players = players.filter(e => e.canAnswerCard(param.cause as Card, askingParam.cardClassName));
            players = players.filter(e => e.hasCardClass(askingParam.cardClassName));
            if (players.length == 0) {
                resolve({});
                return;
            }
            this.beginAsk(AskingType.UseCard, askingName, players, () => this.askUseCard(askingName, param));
            this.askingParam = askingParam;
            let alivePlayers = this.alivePlayers;
            alivePlayers.forEach(player => {
                let askSeatIDs: number[] = alivePlayers.filter(e => e != player || players.includes(player)).map(e => e.seatID);
                player.socket.emit('ask use card', {
                    seatIDs: askSeatIDs,
                    askingName,
                    param: p,
                });
            });
            let n = 0;
            let listeners: any[] = [];
            players.every((player, i) => {
                listeners.push(
                    {
                        player,
                        eventName: 'do not use card',
                        listener: () => {
                            n++;
                            if (n == players.length) {
                                this.sockets.emitAI('asking response', {
                                    ok: false,
                                });
                                this.endAsk();
                                this.sockets.emit('end ask');
                                resolve({});
                            } else {
                                listeners.forEach(element => {
                                    if (element.player == player)
                                        player.socket.removeListener(element.eventName, element.listener);
                                });
                            }
                        },
                    },
                    {
                        player,
                        eventName: 'use card',
                        listener: async (data: { cardID?: number, skill: string, skillParam: any }) => {
                            let card: Card | undefined;
                            if (typeof data.cardID == 'undefined') {
                                card = await player.respondBySkill(data.skill, data.skillParam);
                                if (!card)
                                    return;
                            } else {
                                card = this.getCardByID(data.cardID);
                                if (player.hand.every(e => e != card))
                                    throw new Error('select card incorrectly');
                            }
                            let selected: Player[] = [];
                            this.sockets.emitAI('asking response', {
                                seatID: player.seatID,
                                ok: true,
                                cardIDs: [data.cardID],
                            });
                            this.endAsk();
                            this.sockets.emit('end ask');
                            let ret = await player.useCard(card, selected, param.targets);
                            resolve({
                                player,
                                card,
                                ret,
                            });
                        },
                    },
                );
                return true;
            });
            this.setAskingListeners(listeners, reject);
        });
    }
    public showGlobalCardsWindow(title: string, cards: Card[]) {
        this.globalCardsWindowFirstTitle = title;
        this.globalCards = cards;
        this.sockets.emit('show global cards window', {
            title,
            cardIDs: Game.getCardIDs(cards),
        });
    }
    public closeGlobalCardsWindow() {
        this.sockets.emit('close global cards window');
    }
    public playSound(name: string) {
        this.sockets.emit('play sound', name);
    }
    public setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]) {
        if (this.virtual) callback(...args);
        else return setTimeout(callback, ms, ...args);
    }
    public async timeout(ms: number) {
        if (this.virtual)
            return;
        await Util.timeout(ms);
    }
    public getPlayerBySeatNum(seatNum: number): Player {
        let ret: any;
        this.players.every(element => {
            if (element.seatNum == seatNum) {
                ret = element;
                return false;
            }
            return true;
        });
        return ret;
    }
    public getPlayerBySeatID(seatID: number, mustBeAlive: boolean = false): Player {
        if (seatID in this.players) {
            if (mustBeAlive && !this.players[seatID].alive)
                throw new Error('player is not alive');
            return this.players[seatID];
        } else throw new Error('seatID does not exist');
    }
    public getPlayersByIdentities(identities: Identity[], includeDead: boolean = false) {
        return (includeDead ? this.players : this.alivePlayers).filter(player => identities.includes(player.identity));
    }
    public getPlayersCountByIdentities(identities: Identity[], includeDead: boolean = false) {
        return this.getPlayersByIdentities(identities, includeDead).length;
    }
    public getPlayersByIdentity(identity: Identity, includeDead: boolean = false) {
        return this.getPlayersByIdentities([identity], includeDead);
    }
    public getPlayersCountByIdentity(identity: Identity, includeDead: boolean = false) {
        return this.getPlayersByIdentity(identity, includeDead).length;
    }
    public getCardByID(id: number): Card {
        if (id == 0) return this.unknownCard;
        let card = this.cards.find(e => e.cardID == id);
        card = card || this.unknownCard;
        return card;
    }
    public getCardsByID(IDs: number[]): Card[] {
        return IDs.map(ID => this.getCardByID(ID));
    }
    public makeVirtualCard(className: string, realCards: Card[] = []): Card {
        let card = new Card(this, {
            cardID: 0,
            class: className,
            number: realCards.length == 1 ? realCards[0].number : 0,
            suit: Suit.None,
        });
        card.virtual = true;
        card.realCards = realCards;
        return card;
    }
    public makeUnknownCards(n: number): Card[] {
        return new Array(n).fill(this.unknownCard);
    }
    public askingMatch(askingType: AskingType, askingName?: string) {
        if (askingType != this.askingType) {
            return false;
        } else if (askingName && askingName != this.askingName) {
            return false;
        }
        return true;
    }
    public async beginGame(originalRoom?: Room) {
        console.log('a game begin in room ' + this.id);
        this.randomIndex = 0;
        this.allRandom = originalRoom ? [...originalRoom.allRandom] : [];
        this.discardPile = new Pile();
        this.cardPile = new Pile();
        this.disposeZone = new Pile();
        this.initEvents();
        this.cards = [];
        this.cardIDs.forEach((cardID) => {
            let card = new Card(this, Game.getCardByID(cardID));
            card.zone = Zone.CardPile;
            this.cards.push(card);
        });
        delete this.cardIDs;
        this.cardPile.set([...this.cards]);
        this.cardPile.shuffle(this.random);
        this.cardPile.every((element, index) => {
            if (element.cardID == 0)
                console.log(index, this.cardPile);
            return true;
        });
        this.players = [];
        for (let i of Util.getRandomSequence(Util.getRangeArr(0, this.playerCount - 1), this.random)) {
            let seatID = this.players.length;
            this.players.push(new Player(this.users[i], seatID));
        }
        this.initSockets();
        this.sockets.emit('game begin', this.playerCount);
        this.players.forEach(player => {
            player.socket.emit('set seatID', player.seatID);
        });
        let seatNums: object[] = this.players.map((player, i) => {
            player.seatNum = i + 1;
            return {
                seatID: player.seatID,
                seatNum: player.seatNum,
            };
        });
        this.sockets.emit('set seatNum', seatNums);
        await this.earlierEvents.emit(GameEarlierEvent.DealIdentities, this.players);
        this.initGenerals();
        await this.earlierEvents.emit(GameEarlierEvent.ExtraMaxHP, this.players);
        await this.earlierEvents.emit(GameEarlierEvent.ExtraSkill, this.players);
        await this.earlierEvents.emit(GameEarlierEvent.DealCards, this.players);
        this.events.enabled = true;
        try {
            await this.events.emit(GameEvent.GameBegin, this.players);
            this.initRounds();
            await this.nextRound();
        } catch (e) {
            this.catchError(e);
        }
    }
    public async endGame(winners: Player[]) {
        console.log('a game ends in room ' + this.id);
        this.sockets.emit('game end', winners.map(player => player.seatID));
        if (!this.restart)
            return;
        await this.timeout(3000);
        throw new Error('game end');
    }
}
interface IMoveCards {
    fromSeatID?: number;
    toSeatID?: number;
    fromZone?: Zone;
    toZone: Zone;
    cards: Card[];
}
type AskingListeners = Array<{ player: Player; eventName: string; listener: (data: any) => any }>;
export default Room;
