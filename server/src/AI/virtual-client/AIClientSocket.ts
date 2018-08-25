import Events = require('events');
import ISocket from '../../ISocket';
import AIServerSocket from '../AIServerSocket';
class AIClientSocket implements ISocket {
    public events = new Events.EventEmitter();
    private serverSocket: AIServerSocket;
    constructor(serverSocket: AIServerSocket) {
        this.events.setMaxListeners(Infinity);
        this.serverSocket = serverSocket;
    }
    public emit(event: string | symbol, ...args: any[]): boolean {
        setTimeout(() => {
            this.serverSocket.events.emit(event, ...args);
        }, 1);
        return true;
    }
    public on(event: string | symbol, listener: (...args: any[]) => void): this {
        this.events.on(event, listener);
        return this;
    }
    public once(event: string | symbol, listener: (...args: any[]) => void): this {
        this.events.once(event, listener);
        return this;
    }
    public removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        this.events.removeListener(event, listener);
        return this;
    }
    public removeAllListeners(event?: string | symbol): this {
        this.events.removeAllListeners(event);
        return this;
    }
}

export default AIClientSocket;
