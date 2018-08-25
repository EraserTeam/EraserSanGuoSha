interface ISocket {
    emit(event: string | symbol, ...args: any[]): boolean;
    on(event: string | symbol, listener: (...args: any[]) => void, ...args: any[]): this;
    once(event: string | symbol, listener: (...args: any[]) => void, ...args: any[]): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
}
export default ISocket;
