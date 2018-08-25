import AskingType from '../../AskingType';
import Card from '../../Card';
import Game from '../../Game';
import { GameSyncEventEmitter } from '../../GameEventEmitter';
import Identity from '../../Identity';
import IResponse from '../../IResponse';
import RequireType from '../../RequireType';
import Suit from '../../Suit';
import Zone from '../../Zone';
import AIServerSocket from '../AIServerSocket';
import AIClientSocket from './AIClientSocket';
import Player from './Player';
import Robot from './Robot';
import Round from './Round';
import SelfPlayer from './SelfPlayer';
class Room {
    public robot: Robot;
    public socket: AIClientSocket;
    public unknownCard: Card = new Card(this, Game.unknownCard);
    public cardIDs?: Set<number>;
    public cards!: Card[];
    public round = new Round();
    public playerCount!: number;
    public players!: Player[];
    public selfPlayer!: SelfPlayer;
    public askPlayers!: Player[];
    public askingType: AskingType = AskingType.None;
    public askingName: string = '';
    public askingParam: any;
    public askingSkillName: string = '';
    public extraEndAskCount!: number;
    public disposeZone!: Card[];
    public events = { on: () => { } };
    public syncEvents = new GameSyncEventEmitter();
    public earlierEvents = this.events;
    private modeName: string = 'StandardIdentityMode';
    private includedComponent: any = {};
    private isIncludingMode: boolean = false;
    public identitiesGuess: Identity[] = [];
    public globalCards: Card[] = [];
    public usedRecord: IResponse[] = [];
    public askCallback?: (selfPlayer: SelfPlayer) => void;
    public recordIndex: number = 0;
    constructor(robot: Robot, serverSocket: AIServerSocket) {
        this.robot = robot;
        this.socket = new AIClientSocket(serverSocket);
        this.initSocket();
    }
    private initSocket() {
        this.socket.on('game begin', (playerCount: number) => {
            this.playerCount = playerCount;
            this.initGame();
        });
        this.socket.on('game end', (winners: number[]) => {
            this.selfPlayer.end(winners.includes(this.selfPlayer.seatID));
        });
        this.socket.on('set seatID', (seatID: number) => {
            this.selfPlayer.seatID = seatID;
            this.initPlayers();
        });
        this.socket.on('set seatNum', (seatNums: any[]) => {
            seatNums.forEach(element => {
                this.players[element.seatID].seatNum = element.seatNum;
            });
        });
        this.socket.on('set maxHP', data => {
            this.players[data.seatID].maxHP = data.maxHP;
        });
        this.socket.on('set HP', data => {
            this.players[data.seatID].HP = data.HP;
        });
        this.socket.on('set alive', data => {
            this.players[data.seatID].alive = data.alive;
        });
        this.socket.on('move card', (data: IMoveCardData) => {
            data.commonCards = this.getCardsByID(data.cardIDs);
            data.realCards = [...data.commonCards];
            data.cards = [...data.commonCards];
            if (data.virtualCardsInfo) {
                data.virtualCards = data.virtualCardsInfo.map(virtualCardInfo =>
                    this.makeVirtualCard(
                        virtualCardInfo.className,
                        this.getCardsByID(virtualCardInfo.cardIDs),
                    ),
                );
                data.cards.push(...data.virtualCards);
                data.realCards.push(...data.virtualCards.reduce((arr: Card[], card) => {
                    arr.push(...card.realCards);
                    return arr;
                }, []));
            } else {
                data.virtualCards = [];
            }
            data.allCards = [...data.virtualCards, ...data.realCards];
            data.allCards.forEach(card => {
                card.zone = data.toZone;
                card.seatID = data.toSeatID;
            });
            if (data.fromZone == Zone.Hand) {
                this.players[data.fromSeatID].removeHandCards(data.cards);
            } else if (data.fromZone == Zone.Dispose) {
                data.cardIDs.forEach(cardID => {
                    for (let i = 0; i < this.disposeZone.length; i++) {
                        if (this.disposeZone[i].cardID == cardID) {
                            this.disposeZone.splice(i, 1);
                            i--;
                        }
                    }
                });
            } else if (data.fromZone == Zone.Judge) {
                let fromPlayer = this.players[data.fromSeatID];
                fromPlayer.removeFromJudgeZone([...data.commonCards, ...data.virtualCards]);
            } else if (data.fromZone == Zone.Equip) {
                data.cards.forEach(card => {
                    if (typeof card.class.equipType == 'undefined') return;
                    this.players[data.fromSeatID].setEquip(card.class.equipType, undefined);
                });
            }
            if (data.toZone == Zone.Hand) {
                this.players[data.toSeatID].addHandCards(data.realCards);
            } else if (data.toZone == Zone.Dispose) {
                this.disposeZone.push(...data.realCards);
            } else if (data.toZone == Zone.Judge) {
                this.players[data.toSeatID].addToJudgeZone(data.cards);
            } else if (data.toZone == Zone.Equip) {
                data.cards.forEach(card => {
                    if (typeof card.class.equipType == 'undefined') return;
                    this.players[data.toSeatID].setEquip(card.class.equipType, card);
                });
            }
        });
        this.socket.on('shuffle', () => {
            this.cards.forEach(card => {
                if (card.zone == Zone.CardPile) {
                    card.zone = 0;
                }
            });
        });
        this.socket.on('set round', data => {
            this.round.began = false;
            this.round.phase = 0;
            this.round.player = this.players[data.seatID];
        });
        this.socket.on('round begin', () => {
            this.round.began = true;
        });
        this.socket.on('set phase', data => {
            this.round.phase = data.phase;
        });
        this.socket.on('set identity', data => {
            this.players[data.seatID].identity = data.identity;
        });
        this.socket.on('set back', data => {
            this.players[data.seatID].back = data.back;
        });
        this.socket.on('set flag', data => {
            this.players[data.seatID].setFlag(data.key, data.value);
        });
        this.socket.on('ask play card', data => {
            this.players[data.seatID].askPlaycard();
        });
        this.socket.on('ask discard', data => {
            this.players[data.seatID].askDiscard(data.askingName, data.param);
        });
        this.socket.on('ask respond card', data => {
            this.players[data.seatID].askRespondCard(data.askingName, data.param);
        });
        this.socket.on('ask use card', data => {
            if (data.seatIDs) {
                if (data.seatIDs.includes(this.selfPlayer.seatID))
                    this.selfPlayer.askUseCard(data.askingName, data.param, true);
                else
                    this.players[data.seatIDs[0]].askUseCard(data.askingName, data.param, true);
            } else {
                if (data.seatID == this.selfPlayer.seatID)
                    this.selfPlayer.askUseCard(data.askingName, data.param);
            }
        });
        this.socket.on('ask select cards in window', data => {
            let i = 0;
            data.param.cards = data.param.cardIDs.map((cardID: number) => {
                let className;
                if (cardID == 0 && (className = data.param.classNames[i++])) {
                    let card = this.makeVirtualCard(className);
                    card.zone = Zone.Judge;
                    return card;
                } else {
                    return this.getCardByID(cardID);
                }
            });
            delete data.param.cardIDs;
            this.players[data.seatID].askSelectCardsInWindow(data.askingName, data.param);
        });
        this.socket.on('show global cards window', data => {
            this.globalCards = this.getCardsByID(data.cardIDs);
        });
        /*
        this.socket.on('set global cards window title', title => {
            
        });
        */
        this.socket.on('ask select global card in window', data => {
            if (data.seatID == this.selfPlayer.seatID) {
                this.selfPlayer.askSelectGlobalCardInWindow();
            }
        });
        this.socket.on('global card selected', data => {
            let i = this.globalCards.findIndex(card => card.cardID == data.cardID);
            this.globalCards.splice(i, 1);
        });
        this.socket.on('ask use skill', data => {
            this.players[data.seatID].askUseSkill(data.skillName, data.param);
        });
        this.socket.on('ask select suit', data => {
            this.players[data.seatID].askSelectSuit(data.askingName, data.param);
        });
        this.socket.on('close global cards window', () => {
            this.globalCards = [];
        });
        this.socket.on('end ask', () => {
            this.selfPlayer.endAsk();
        });
    }
    private initGame() {
        this.extraEndAskCount = 0;
        this.players = [];
        this.selfPlayer = new SelfPlayer(this);
        this.disposeZone = [];
        this.initEvents();
        this.cards = [];
        (this.cardIDs as Set<number>).forEach((cardID) => {
            let card = new Card(this, Game.getCardByID(cardID));
            card.zone = Zone.CardPile;
            this.cards.push(card);
        });
        delete this.cardIDs;
    }
    private initEvents() {
        this.includedComponent = {};
        this.syncEvents = new GameSyncEventEmitter();
        this.cardIDs = new Set<number>();
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
    private initPlayers() {
        for (let i = 0; i < this.playerCount; i++) {
            let player: Player = i == this.selfPlayer.seatID ? this.selfPlayer : new Player(this);
            player.seatID = i;
            this.players.push(player);
        }
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
    public getUnknownCardIDs() {
        return Game.getCardIDs(this.cards.filter(card => card.zone == 0));
    }
    public get alivePlayers(): Player[] {
        return this.players.filter(player => player.alive);
    }
}
interface IMoveCardData {
    fromSeatID: number;
    toSeatID: number;
    fromZone: Zone;
    toZone: Zone;
    cardIDs: number[];
    virtualCardsInfo?: Array<{
        className: string;
        cardIDs: number[];
    }>;
    virtualCards: Card[]; //虚拟牌
    commonCards: Card[]; //普通牌，即无所属虚拟牌的实体牌
    cards: Card[]; //虚拟牌和普通牌
    realCards: Card[]; //实体牌
    allCards: Card[]; //所有牌
}

export default Room;
