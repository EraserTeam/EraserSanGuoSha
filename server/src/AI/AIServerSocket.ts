import Events = require('events');
import ISocket from '../ISocket';
import Room from '../Room';
import Robot from './virtual-client/Robot';
class AIServerSocket implements ISocket {
    public events = new Events.EventEmitter();
    public robot: Robot = new Robot(this);
    constructor() {
        this.events.setMaxListeners(Infinity);
    }
    public emit(event: string | symbol, ...args: any[]): boolean {
        return this.robot.room.socket.events.emit(event, ...args);
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

export default AIServerSocket;
