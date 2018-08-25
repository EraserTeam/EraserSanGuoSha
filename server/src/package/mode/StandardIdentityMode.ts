import Game from '../../Game';
import GameEarlierEvent from '../../GameEarlierEvent';
import RequireType from '../../RequireType';
import Room from '../../Room';
export = () => {
    Game.createMode({
        name: 'StandardIdentityMode',
        init: (room: Room) => {
            room.require([
                {
                    type: RequireType.Mode,
                    name: 'IdentityMode',
                },
                {
                    type: RequireType.Mode,
                    name: 'DefaultDealCards',
                },
                {
                    type: RequireType.Package,
                    name: 'std/card',
                },
                {
                    type: RequireType.Package,
                    name: 'ex',
                },
                {
                    type: RequireType.Package,
                    name: 'std/general',
                },
                {
                    type: RequireType.Package,
                    name: 'wind',
                },
            ]);
            for (let i = 1; i <= 108; i++) {
                room.cardIDs.add(i);
            }
        },
    });
};
