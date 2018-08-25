Package.modes.StandardIdentityMode = () => {
    Game.createMode({
        name: 'StandardIdentityMode',
        init: (room: Room) => {
            room.require([
                {
                    type: RequireType.Mode,
                    name: 'IdentityMode',
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