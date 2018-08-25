class Game {
    public static socket: SocketIOClient.Socket;
    public static cards: ICardInfo[];
    public static unknownCard: ICardInfo = {
        cardID: 0,
        class: '',
        number: 0,
        suit: 0,
    };
    public static packages: any = {};
    public static cardClasses: any = {};
    public static skills: any = {};
    public static generals: any = {};
    public static askingTypeContents: any = {};
    public static askings: any = {};
    public static modes: any = {};
    public static room: Room;
    public static init() {
        Predefined.init();
        Package.init();
        Game.initJSON();
        Game.initSocket();
        Game.room = new Room();
        Game.room.init();
    }
    private static initJSON() {
        this.cards = RES.getRes('Cards_json');
    }
    private static initSocket() {
        this.socket = io.connect('127.0.0.1:43666');
    }
    public static getCardByID(id: number): ICardInfo {
        if (id == 0) return Game.unknownCard;
        let card = Game.cards.find(e => e.cardID == id);
        card = card || Game.unknownCard;
        return card;
    }
    public static getCardsByID(IDs: number[]): ICardInfo[] {
        return IDs.map(id => Game.getCardByID(id));
    }
    public static getCardIDs(cards: Array<ICardInfo | Card>) {
        return cards.map(card => card.cardID);
    }
    public static makeCardUIData(card: Card) {
        let suit: string = Game.getSuitName(card.suit).toLowerCase();
        let color = Game.getColorName(Game.getColor(card.suit));
        return {
            cardID: card.cardID,
            number: color && card.number ? `${color}CardNumber_${card.number}` : '',
            class: `Card_${card.class ? card.class.name : 'Unknown'}_png`,
            suit: suit != 'none' ? suit : '',
            dark: false,
            disabled: true,
        };
    }
    public static getPackage(name: string): Package {
        return Game.packages[name];
    }
    public static createPackage(name: string): Package {
        if (Game.packages[name])
            throw new Error(`Package "${name}" already exists`);
        return Game.packages[name] = new Package(name);
    }
    public static getCardClass(card: ICardInfo): ICardClass {
        return Game.cardClasses[card.class];
    }
    public static getSkill(skillName: string): ISkill {
        return Game.skills[skillName];
    }
    public static getGeneral(name: string): IGeneral {
        return Game.generals[name];
    }
    public static getAskingTypeContents(askingType: AskingType): IAskingTypeContent {
        return Game.askingTypeContents[askingType];
    }
    public static getAsking(askingName: string): IAsking {
        return Game.askings[askingName];
    }
    public static getMode(name: string): Package {
        return Game.modes[name];
    }
    public static createMode(createMode: IMode) {
        if (Game.modes[createMode.name])
            throw new Error(`Mode "${createMode.name}" already exists.`);
        Game.modes[createMode.name] = createMode;
    }
    public static getCountryName(country: Country) {
        return Country[country];
    }
    public static getSuitName(suit: Suit): string {
        return Suit[suit];
    }
    public static getColor(suit: Suit) {
        if (suit == Suit.Heart || suit == Suit.Diamond) {
            return Color.Red;
        } else if (suit == Suit.Spade || suit == Suit.Club) {
            return Color.Black;
        } else {
            return Color.None;
        }
    }
    public static getColorName(color: Color): string {
        return Color[color];
    }
    public static getSexName(sex: Sex): string {
        return Sex[sex];
    }
    public static getIdentityName(identity: Identity): string {
        return Identity[identity];
    }
    public static sortPlayersBySeatNum(players: Player[], base?: Player) {
        let baseSeatNum = base ? base.seatNum : 0;
        return [...players].sort((a, b) => {
            if (a.seatNum >= baseSeatNum && b.seatNum < baseSeatNum)
                return -1;
            else if (a.seatNum < baseSeatNum && b.seatNum >= baseSeatNum)
                return 1;
            else
                return a.seatNum - b.seatNum;
        });
    }
}
