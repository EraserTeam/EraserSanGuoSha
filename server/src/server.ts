import SocketIO = require('socket.io');
const app = require('express')();
const http = require('http').Server(app);
const io: SocketIO.Server = SocketIO(http);

import Game from './Game';

Game.io = io;
Game.init();

io.on('connection', (socket: SocketIO.Socket) => {
    Game.onConnect(socket);
});

http.listen(43666, () => {
    Game.onBeginListening();
});
