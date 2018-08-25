class OthersEquip extends eui.Component {
    private img_equip: eui.Image;
    private img_suit: eui.Image;
    private img_number: eui.Image;
    public constructor() {
        super();
        this.skinName = 'OthersEquipSkin';
    }
    public set equip(equip: Card) {
        let color = Game.getColorName(Game.getColor(equip.suit));
        this.img_equip.source = `Others${equip.class.name}_png`;
        this.img_suit.source = Game.getSuitName(equip.suit).toLowerCase();
        this.img_number.source = `${color}CardNumber_${equip.number}`;
    }
}