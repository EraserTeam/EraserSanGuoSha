import AIServerSocket from './AI/AIServerSocket';
import Game from './Game';
import IResponse from './IResponse';
import ISocket from './ISocket';
import OriginalSocket from './OriginalSocket';
import Player from './Player';
import Room from './Room';
export class Socket implements ISocket {
    public room: Room;
    public player: Player;
    public socket: OriginalSocket;
    public events: Set<string | symbol> = new Set();
    public listenerMap: Map<() => void, () => Promise<void>> = new Map();
    public record: IResponse[] = [];
    constructor(player: Player) {
        this.room = player.room;
        this.player = player;
        this.socket = player.user.socket;
    }
    public emit(event: string | symbol, ...args: any[]): boolean {
        return this.socket.emit.apply(this.socket, arguments);
    }
    public on(event: string | symbol, listener: (...args: any[]) => void, reject: (reason?: any) => void): this {
        let docoratedListener = async (...args: any[]) => {
            this.record.push({event, args});
            try {
                await listener(...args);
            } catch (e) {
                reject(e);
            }
        };
        this.listenerMap.set(listener, docoratedListener);
        this.events.add(event);
        this.socket.on(event, docoratedListener);
        return this;
    }
    public once(event: string | symbol, listener: (...args: any[]) => void, reject: (reason?: any) => void): this {
        let docoratedListener = async (...args: any[]) => {
            this.record.push({event, args});
            try {
                await listener(...args);
            } catch (e) {
                reject(e);
            }
        };
        this.listenerMap.set(listener, docoratedListener);
        this.events.add(event);
        this.socket.once(event, docoratedListener);
        return this;
    }
    public get broadcast(): Sockets {
        return new Sockets(this.room.players.filter(player => player != this.player));
    }
    public removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        let docoratedListener = this.listenerMap.get(listener);
        this.listenerMap.delete(listener);
        this.socket.removeListener(event, docoratedListener || listener);
        return this;
    }
    public removeAllListeners(event?: string | symbol): this {
        this.socket.removeAllListeners.apply(this.socket, arguments);
        return this;
    }
    public clearListeners() {
        this.events.forEach(event => {
            this.removeAllListeners(event);
        });
    }
}
export class Sockets extends Array<Socket> {
    constructor(players: Player[]) {
        super();
        if (players.length == 0)
            return;
        let room = players[0].room;
        players.forEach(player => this.push(player.socket || (player.socket = new Socket(player))));
    }
    public emit(event: string | symbol, ...args: any[]): Sockets {
        this.forEach(socket => {
            socket.emit.apply(socket, arguments);
        });
        return this;
    }
    public emitAI(event: string | symbol, ...args: any[]): Sockets {
        this.forEach(socket => {
            if (socket.socket instanceof AIServerSocket)
                socket.emit.apply(socket, arguments);
        });
        return this;
    }
    public on(event: string | symbol, listener: (...args: any[]) => void): this {
        this.forEach(socket => {
            socket.on.apply(socket, arguments);
        });
        return this;
    }
    public once(event: string | symbol, listener: (...args: any[]) => void): this {
        this.forEach(socket => {
            socket.once.apply(socket, arguments);
        });
        return this;
    }
    public removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        this.forEach(socket => {
            socket.removeListener.apply(socket, arguments);
        });
        return this;
    }
    public removeAllListeners(event?: string | symbol): this {
        this.forEach(socket => {
            socket.removeAllListeners.apply(socket, arguments);
        });
        return this;
    }
    public clearListeners() {
        this.forEach(socket => {
            socket.clearListeners();
        });
    }
}
