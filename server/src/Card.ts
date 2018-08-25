import RobotRoom from './AI/virtual-client/Room';
import Color from './Color';
import Game from './Game';
import ICardClass from './ICardClass';
import ICardInfo from './ICardInfo';
import Room from './Room';
import Suit from './Suit';
import Zone from './Zone';
class Card {
    private data: ICardInfo;
    private _class: ICardClass;
    public zone!: Zone;
    public seatID: number = -1;
    public room: Room | RobotRoom;
    public virtual: boolean = false;
    public realCards: Card[] = [];
    constructor(room: Room | RobotRoom, data: ICardInfo) {
        this.room = room;
        this.data = data;
        this._class = Game.getCardClass(data);
    }
    public get cardID() {
        return this.data.cardID;
    }
    public get class() {
        return this._class;
    }
    public get number(): number {
        if (this.virtual) {
            let n = this.realCards.map(card => card.number).reduce((n, num) => n + num, 0);
            if (n > 13)
                n = 13;
            return n;
        } else
            return +this.data.number;
    }
    public get suit(): Suit {
        if (this.virtual) {
            if (this.realCards.length == 1)
                return this.realCards[0].suit;
            else
                return Suit.None;
        }
        return this.data.suit;
    }
    public get color(): Color {
        if (this.virtual) {
            if (this.realCards.length == 1)
                return Game.getColor(this.realCards[0].suit);
            else
                return (
                    this.realCards.every(card => card.color == Color.Red) && Color.Red ||
                    this.realCards.every(card => card.color == Color.Black) && Color.Black ||
                    Color.None
                );
        } else
            return Game.getColor(this.suit);
    }
    public get inHand(): boolean {
        return this.zone == Zone.Hand;
    }
    public get inEquip(): boolean {
        return this.zone == Zone.Equip;
    }
    public async move(param: IMove) {
        if (this.room instanceof RobotRoom)
            return;
        await this.room.moveCards(Object.assign(param, { cards: [this] }));
    }
}
interface IMove {
    fromSeatID?: number;
    toSeatID?: number;
    fromZone?: Zone;
    toZone: Zone;
}
export default Card;
