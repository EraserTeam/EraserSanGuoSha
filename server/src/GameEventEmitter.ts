import { GameEventCanStop } from './GameEvent';
import { SyncGameEventCanStop } from './GameEvent';
import GameEvent from './GameEvent';
import { GameSyncEvent } from './GameEvent';
class EventEmitter<T extends number> {
    public _listeners: any = {};
    public on(event: T, listener: (...args: any[]) => any, pri: number = 0): this {
        this._listeners[event] = this._listeners[event] || [];
        let index = this._listeners[event].length;
        for (let i of Object.keys(this._listeners[event])) {
            let data = this._listeners[event][i];
            if (pri > data.pri) {
                index = i;
                break;
            }
        }
        this._listeners[event].splice(index, 0, { listener, pri });
        return this;
    }
    public listeners(event: T): Array<{ listener: (...args: any[]) => any; pri: number }> {
        return this._listeners[event] || [];
    }
    public removeListener(event: T, listener: (...args: any[]) => any) {
        for (let evt of Object.keys(this._listeners).map(k => +k)) {
            if (evt == event) {
                this._listeners[event] = this._listeners[event].filter((data: any) => data.listener != listener);
                break;
            }
        }
    }
}
class GameEventEmitter extends EventEmitter<GameEvent> {
    public enabled: boolean = false;
    public async emit(event: GameEvent, ...args: any[]): Promise<any> {
        if (!this.enabled) return;
        let arr = this.listeners(event);
        let ret;
        for (let e of arr) {
            let listener = e.listener;
            ret = await listener(...args);
            if (GameEventCanStop(event, ret)) return ret;
        }
        return ret;
    }
    public async callbackEmit(event: GameEvent, callback: (listener: (...args: any[]) => Promise<any>) => Promise<any>): Promise<void> {
        if (!this.enabled) return;
        let arr = this.listeners(event);
        for (let info of arr) {
            await callback(info.listener);
        }
    }
    public on(event: GameEvent, listener: (...args: any[]) => any, pri: number = 0): this {
        return super.on(event, listener, pri);
    }
}
class GameSyncEventEmitter extends EventEmitter<GameSyncEvent> {
    public emit(event: GameSyncEvent, ...args: any[]): any {
        let arr = this.listeners(event);
        let ret;
        for (let e of arr) {
            let listener = e.listener;
            ret = listener(...args);
            if (SyncGameEventCanStop(event, ret)) return ret;
        }
        return ret;
    }
    public callbackEmit(event: GameSyncEvent, callback: (listener: (...args: any[]) => any) => any): void {
        this.listeners(event).forEach(info => {
            callback(info.listener);
        });
    }
    public on(event: GameSyncEvent, listener: (...args: any[]) => any, pri: number = 0): this {
        return super.on(event, listener, pri);
    }
}
export default GameEventEmitter;
export { GameSyncEventEmitter };
export { EventEmitter };
