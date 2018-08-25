import RobotPlayer from './AI/virtual-client/Player';
import AskingType from './AskingType';
import Card from './Card';
import Color from './Color';
import IAsking from './IAsking';
import IAskingTypeContent from './IAskingTypeContent';
import ICardClass from './ICardClass';
import ICardInfo from './ICardInfo';
import IGeneral from './IGeneral';
import IMode from './IMode';
import ISkill from './ISkill';
import Package from './Package';
import PackageLoader from './package/PackageLoader';
import Player from './Player';
import Predefined from './Predefined';
import Room from './Room';
import Suit from './Suit';
import User from './User';
let room: Room;
class Game {
    public static io: any;
    public static cards: ICardInfo[] = require('../json/Cards.json');
    public static unknownCard: ICardInfo = {
        cardID: 0,
        class: '',
        number: 0,
        suit: 0,
    };
    public static packages: any = {};
    public static cardClasses: any = {};
    public static skills: any = {};
    public static generals: any = {};
    public static askingTypeContents: any = {};
    public static askings: any = {};
    public static modes: any = {};
    public static init() {
        room = new Room();
        console.log(room.id);
        Predefined.init();
        let cardPackages = PackageLoader.loadCardPackages();
        cardPackages.forEach(func => {
            func();
        });
        let generalPackages = PackageLoader.loadGeneralPackages();
        generalPackages.forEach(func => {
            func();
        });
        let modes = PackageLoader.loadModes();
        modes.forEach(func => {
            func();
        });
    }
    public static onBeginListening() {
        console.log('server is listening on 43666');
    }
    public static onConnect(socket: any) {
        console.log('a user connected');
        let user: User = new User(socket);
        socket.on('disconnect', () => {
            User.delete(user);
            console.log('a user disconnected');
        });
        socket.on('join room', (roomID: number) => {
            user.joinRoom(room.id);
            socket.emit('join room', room.id);
        });
    }
    public static getCardByID(id: number): ICardInfo {
        if (id == 0) return Game.unknownCard;
        let card = Game.cards.find(e => e.cardID == id);
        card = card || Game.unknownCard;
        return card;
    }
    public static getCardsByID(IDs: number[]): ICardInfo[] {
        return IDs.map(id => Game.getCardByID(id));
    }
    public static getCardIDs(cards: Array<ICardInfo | Card>) {
        return cards.map(card => card.cardID);
    }
    public static getPackage(name: string): Package {
        return Game.packages[name];
    }
    public static createPackage(name: string): Package {
        if (Game.packages[name])
            throw new Error(`Package "${name}" already exists.`);
        return Game.packages[name] = new Package(name);
    }
    public static getCardClass(card: ICardInfo): ICardClass {
        return Game.cardClasses[card.class];
    }
    public static getSkill(skillName: string): ISkill {
        return Game.skills[skillName];
    }
    public static getGeneral(name: string): IGeneral {
        return Game.generals[name];
    }
    public static getAskingTypeContents(askingType: AskingType): IAskingTypeContent {
        return Game.askingTypeContents[askingType];
    }
    public static getAsking(askingName: string): IAsking {
        return Game.askings[askingName];
    }
    public static getMode(name: string): Package {
        return Game.modes[name];
    }
    public static createMode(createMode: IMode) {
        if (Game.modes[createMode.name])
            throw new Error(`Mode "${createMode.name}" already exists.`);
        Game.modes[createMode.name] = createMode;
    }
    public static getColor(suit: Suit) {
        if (suit == Suit.Heart || suit == Suit.Diamond) {
            return Color.Red;
        } else if (suit == Suit.Spade || suit == Suit.Club) {
            return Color.Black;
        } else {
            return Color.None;
        }
    }
    public static sortPlayersBySeatNum<T extends Player | RobotPlayer>(players: T[], base?: T) {
        let baseSeatNum = base ? base.seatNum : 0;
        return [...players].sort((a, b) => {
            if (a.seatNum >= baseSeatNum && b.seatNum < baseSeatNum)
                return -1;
            else if (a.seatNum < baseSeatNum && b.seatNum >= baseSeatNum)
                return 1;
            else
                return a.seatNum - b.seatNum;
        });
    }
}
export default Game;
