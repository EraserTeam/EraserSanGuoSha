import Game from '../../Game';
import GameEarlierEvent from '../../GameEarlierEvent';
import Player from '../../Player';
import Room from '../../Room';
export = () => {
    Game.createMode({
        name: 'DefaultDealCards',
        abstract: true,
        init: (room: Room) => {
            room.earlierEvents.on(GameEarlierEvent.DealCards, async (players: Player[]) => {
                for (let player of players) {
                    await player.drawCards(4);
                }
            });
        },
    });
};
