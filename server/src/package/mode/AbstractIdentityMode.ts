import Game from '../../Game';
import Room from '../../Room';
export = () => {
    Game.createMode({
        name: 'AbstractIdentityMode',
        abstract: true,
        init: (room: Room) => {
            
        },
    });
};
