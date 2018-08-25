import { GameEarlierEventCanStop } from './GameEarlierEvent';
import GameEarlierEvent from './GameEarlierEvent';
import { EventEmitter } from './GameEventEmitter';
class GameEarlierEventEmitter extends EventEmitter<GameEarlierEvent> {
    public async emit(event: GameEarlierEvent, ...args: any[]): Promise<any> {
        let arr = this.listeners(event);
        let ret;
        for (let e of arr) {
            let listener = e.listener;
            ret = await listener(...args);
            if (GameEarlierEventCanStop(event, ret)) return ret;
        }
        return ret;
    }
    public async callbackEmit(event: GameEarlierEvent, callback: (listener: (...args: any[]) => Promise<any>) => Promise<any>): Promise<void> {
        let arr = this.listeners(event);
        for (let info of arr) {
            await callback(info.listener);
        }
    }
    public on(event: GameEarlierEvent, listener: (...args: any[]) => any, pri: number = 0): this {
        return super.on(event, listener, pri);
    }
}
export default GameEarlierEventEmitter;
