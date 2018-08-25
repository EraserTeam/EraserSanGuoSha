import Card from './Card';
import Game from './Game';
import * as Util from './Util';
class Pile extends Array<Card> {
    public remove(cards: Card[]) {
        if (cards == this)
            cards = [...cards];
        cards.forEach(element => {
            for (let i = 0; i < this.length; i++) {
                if (this[i].cardID == element.cardID) {
                    this.splice(i, 1);
                    return;
                }
            }
        });
    }
    public add(cards: Card[]) {
        this.push(...cards);
    }
    public set(cards: Card[]) {
        this.splice(0);
        this.add(cards);
    }
    public shuffle(random?: (a: number, b: number) => number) {
        Util.shuffle(this, random);
    }
}
export default Pile;
