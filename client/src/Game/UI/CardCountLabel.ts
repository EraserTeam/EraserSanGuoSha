class CardCountLabel extends eui.Component {
    public img_bg: eui.Image;
    public lb_cardCount: eui.Label;
    public constructor() {
        super();
    }
    public set country(country: Country) {
        this.img_bg.source = `${Game.getCountryName(country)}CardCountBG`;
    }
}