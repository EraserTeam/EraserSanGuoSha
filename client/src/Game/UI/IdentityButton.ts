class IdentityButton extends eui.Component {
    private img_identity: eui.Image;
    private _identity: Identity = Identity.Unknown;
    private hide: boolean = false;
    private hostButton: IdentityButton;
    private buttonList: IdentityButton[];
    private showingList: boolean = false;
    public constructor() {
        super();
        this.once(egret.Event.COMPLETE, this.onComplete, this);
    }
    private onComplete() {
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClick, this);
    }
    private static getIdentityPicName(identity: Identity) {
        return `Identity_${Game.getIdentityName(identity)}_png`;
    }
    public get identity() {
        return this._identity;
    }
    public set identity(identity: Identity) {
        this._identity = identity;
        this.showIdentity();
    }
    public showIdentity() {
        this.hide = false;
        this.img_identity.source = IdentityButton.getIdentityPicName(this.identity);
    }
    public hideIdentity() {
        this.hide = true;
        this.img_identity.source = IdentityButton.getIdentityPicName(Identity.Unknown);
    }
    public setIdentityVisible(bool: boolean) {
        bool ? this.showIdentity() : this.hideIdentity();
    }
    private showList() {
        this.showingList = true;
        this.buttonList = [];
        let {x, y, height} = this;
        for (let identity of Game.room.identitiesGuess) {
            y = y + height + 5;
            let btn = new IdentityButton();
            btn.skinName = 'IdentityButtonSkin';
            btn.hostButton = this;
            btn.identity = identity;
            [btn.x, btn.y] = [x, y];
            this.parent.addChild(btn);
            this.buttonList.push(btn);
        }
    }
    private removeList() {
        this.showingList = false;
        this.buttonList.forEach((btn) => {
            this.parent.removeChild(btn);
        });
        this.buttonList = [];
    }
    private setListExistent(bool: boolean) {
        bool ? this.showList() : this.removeList();
    }
    private guessIdentity(identity: Identity) {
        this.img_identity.source = IdentityButton.getIdentityPicName(identity);
    }
    public onClick() {
        if (this.hostButton) {
            if (this.hostButton.identity == Identity.Unknown) {
                this.hostButton.guessIdentity(this.identity);
            }
            this.hostButton.removeList();
        } else {
            if (this.identity == Identity.Unknown) {
                this.guessIdentity(Identity.Unknown);
                this.setListExistent(!this.showingList);
            } else {
                this.setIdentityVisible(this.hide);
            }
        }
    }
}