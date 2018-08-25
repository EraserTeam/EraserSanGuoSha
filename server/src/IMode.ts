import Room from './Room';
interface IMode {
    name: string;
    abstract?: boolean;
    init?(room: Room): void;
}
export default IMode;
