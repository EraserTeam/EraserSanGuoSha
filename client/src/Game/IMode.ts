interface IMode {
    name: string;
    abstract?: boolean;
    init?(room: Room): void;
}