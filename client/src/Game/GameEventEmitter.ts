class EventEmitter<T extends number> {
    public _listeners: any = {};
    public on(event: T, listener: (...args: any[]) => any, pri: number = 0): this {
        this._listeners[event] = this._listeners[event] || [];
        let index = this._listeners[event].length;
        for (let [i, data] of this._listeners[event].entries()) {
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
    public callbackEmit(event: GameSyncEvent, callback: (listener: (...args: any[]) => any) => any) {
        this.listeners(event).forEach(info => {
            callback(info.listener);
        });
    }
    public on(event: GameSyncEvent, listener: (...args: any[]) => any, pri: number = 0): this {
        return super.on(event, listener, pri);
    }
}