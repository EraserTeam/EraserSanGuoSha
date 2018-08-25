Package.modes.IdentityMode = () => {
    Game.createMode({
        name: 'IdentityMode',
        abstract: true,
        init: (room: Room) => {
            room.require(RequireType.Mode, 'AbstractIdentityMode');
            room.identitiesGuess = [Identity.FanZei, Identity.ZhongChen, Identity.NeiJian];
        },
    });
};