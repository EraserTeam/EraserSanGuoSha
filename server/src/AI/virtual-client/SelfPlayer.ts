import fs = require('fs');
import AskingType from '../../AskingType';
import Card from '../../Card';
import Game from '../../Game';
import IResponse from '../../IResponse';
import Suit from '../../Suit';
import * as Util from '../../Util';
import AI from '../AI';
import Player from './Player';
class SelfPlayer extends Player {
    protected get self() {
        return true;
    }
    public async askPlaycard() {
        super.askPlaycard();
        if (!await this.answerAdvancedly()) {
            this.answerNo();
        }
    }
    public async askDiscard(askingName: string, param: any) {
        super.askDiscard(askingName, param);
        if (!await this.answerAdvancedly()) {
            let i = Util.random(0, this.hand.length - this.room.askingParam.minCount);
            this.answer(Game.getCardIDs(this.hand.slice(i, i + this.room.askingParam.minCount)));
        }
    }
    public async askRespondCard(askingName: string, param: any) {
        super.askRespondCard(askingName, param);
        if (!await this.answerAdvancedly()) {
            this.answerNo();
        }
    }
    public async askUseCard(askingName: string, param: any, multiplayer = false) {
        if (!await super.askUseCard(askingName, param, multiplayer))
            return false;
        if (!await this.answerAdvancedly()) {
            this.answerNo();
        }
        return true;
    }
    public async askSelectCardsInWindow(askingName: string, param: any) {
        super.askSelectCardsInWindow(askingName, param);
        if (!await this.answerAdvancedly()) {
            let i = Util.random(0, this.hand.length - this.room.askingParam.cardCount);
            let selectedCards: Card[] = this.room.askingParam.cards.splice(i, this.room.askingParam.cardCount);
            this.room.socket.emit('select cards', {
                cardIDs: Game.getCardIDs(selectedCards),
                classNames: selectedCards.filter(card => card.cardID == 0).map(card => card.class.name),
            });
            this.endAsk();
        }
    }
    public async askSelectGlobalCardInWindow() {
        super.askSelectGlobalCardInWindow();
        if (!await this.answerAdvancedly()) {
            let i = Util.random(0, this.room.globalCards.length - 1);
            let selectedCards = this.room.globalCards.splice(i, 1);
            this.room.socket.emit('select card', selectedCards[0].cardID);
            this.endAsk();
        }
    }
    public askUseSkill(skillName: string, param?: any) {
        super.askUseSkill(skillName, param);
        this.answerNo();
    }
    public askSelectSuit(askingName: string, param: any) {
        super.askSelectSuit(askingName, param);
        let i = Util.random(0, this.room.askingParam.suits - 1);
        let suit = this.room.askingParam.suits[i];
        this.answer(suit);
    }
    private getAnswerEventName() {
        switch (this.room.askingType) {
            case AskingType.UseCard:
            case AskingType.PlayCard:
                return 'use card';
            case AskingType.Discard:
                return 'discard';
            case AskingType.RespondCard:
                return 'respond card';
            case AskingType.UseSkill:
                return 'use skill';
            case AskingType.SelectSuit:
                return 'select suit';
            default:
                throw new Error('unknown askingType');
        }
    }
    public answer(data: any) {
        this.room.socket.emit(this.getAnswerEventName(), data);
        this.endAsk();
    }
    public answerNo() {
        let event;
        if (this.room.askingType == AskingType.PlayCard) {
            event = 'end play card';
        } else {
            event = `do not ${this.getAnswerEventName()}`;
        }
        this.room.socket.emit(event);
        this.endAsk();
    }
    public async answerAdvancedly() {
        if (!this.anwserByRecord()) {
            await this.answerByAI();
        }
        return true;
    }
    public anwserByRecord() {
        if (this.room.recordIndex == this.room.usedRecord.length) {
            return false;
        } else {
            let response = this.room.usedRecord[this.room.recordIndex++];
            this.room.socket.emit(response.event, ...response.args);
            this.endAsk();
            return true;
        }
    }
    public async answerByAI() {
        this.answerByRandom();
    }
    public answerByRandom() {
        let responses = this.getResponses();
        let i = Util.random(0, responses.length - 1);
        this.room.socket.emit(responses[i].event, ...responses[i].args);
        this.endAsk();
    }
    private getResponses(): IResponse[] {
        let responses: IResponse[] = [];
        let cards: Card[];
        switch (this.room.askingType) {
            case AskingType.PlayCard:
                for (let card of this.hand) {
                    responses.push(...this.getUseCardResponses(card));
                }
                responses.push({
                    event: 'end play card',
                    args: [],
                });
                break;
            case AskingType.Discard:
                responses.push(
                    ...this.getSelectCardsWays({
                        min: this.room.askingParam.minCount,
                        max: this.room.askingParam.maxCount,
                    }, this.hand).map(cards => ({
                        event: 'discard',
                        args: [Game.getCardIDs(cards)],
                    })),
                );
                break;
            case AskingType.RespondCard:
                cards = this.hand.filter(card => card.class.name == this.room.askingParam.cardClassName);
                responses.push(...
                    cards.map(card => ({
                        event: 'respond card',
                        args: [{
                            cardID: card.cardID,
                        }],
                    })),
                );
                responses.push({
                    event: 'do not respond card',
                    args: [],
                });
                break;
            case AskingType.UseCard:
                cards = this.hand.filter(card => card.class.name == this.room.askingParam.cardClassName);
                responses.push(...
                    cards.map(card => ({
                        event: 'use card',
                        args: [{
                            cardID: card.cardID,
                        }],
                    })),
                );
                responses.push({
                    event: 'do not use card',
                    args: [],
                });
                break;
            case AskingType.SelectCardInWindow:
                responses.push(
                    ...this.getSelectCardsWays({
                        min: this.room.askingParam.cardCount,
                        max: this.room.askingParam.cardCount,
                    }, this.room.askingParam.cards).map(cards => ({
                        event: 'select cards',
                        args: [{
                            cardIDs: Game.getCardIDs(cards),
                            classNames: cards.filter(card => card.cardID == 0).map(card => card.class.name),
                        }],
                    })),
                );
                break;
            case AskingType.SelectGlobalCardInWindow:
                responses.push(
                    ...this.getSelectCardsWays({
                        min: 1,
                        max: 1,
                    }, this.room.globalCards).map(cards => ({
                        event: 'select card',
                        args: [cards[0].cardID],
                    })),
                );
                break;
            case AskingType.SelectSuit:
                responses.push(
                    ...this.room.askingParam.suits.map((suit: Suit) => ({
                        event: 'select suit',
                        args: [suit],
                    })),
                );
                break;
        }
        return responses;
    }
    private getSelectCardsWays(condition: { min: number, max: number }, allCards: Card[], selectedCards: Card[] = []): Card[][] {
        let ways: Card[][] = [];
        if (selectedCards.length >= condition.min)
            ways.push(selectedCards);
        if (selectedCards.length + 1 > condition.max)
            return ways;
        let cards = allCards.filter(card => !selectedCards.includes(card));
        for (let card of cards) {
            ways.push(...this.getSelectCardsWays(condition, allCards, [...selectedCards, card]));
        }
        return ways;
    }
    private getUseCardResponses(card: Card, selected: Player[] = []): IResponse[] {
        if (selected.length == 0 && !this.cardEnabled(card))
            return [];
        let responses: IResponse[] = [];
        if (this.cardSelectCorrectly(card, selected)) {
            responses.push({
                event: 'use card',
                args: [{
                    cardID: card.cardID,
                    selected: selected.map(player => player.seatID),
                }],
            });
        }
        let targets = this.room.alivePlayers.filter(player => !selected.includes(player));
        let players = this.cardFilterSelect(card, selected, targets);
        if (players.length == 0)
            return responses;
        for (let player of players) {
            responses.push(...this.getUseCardResponses(card, [...selected, player]));
        }
        return responses;
    }
    public end(win: boolean) {
        if (this.room.askCallback) {
            this.room.askCallback(this);
        }
        if (win) {}
    }
}

export default SelfPlayer;
