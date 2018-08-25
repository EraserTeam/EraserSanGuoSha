class OperationArea extends eui.Component {
    public btn_ok: eui.Button;
    public btn_cancel: eui.Button;
    public btn_over: eui.Button;
    public btn_heart: eui.Button;
    public btn_diamond: eui.Button;
    public btn_spade: eui.Button;
    public btn_club: eui.Button;
    private btnMap = {
        ok: () => this.btn_ok,
        cancel: () => this.btn_cancel,
        over: () => this.btn_over,
        heart: () => this.btn_heart,
        diamond: () => this.btn_diamond,
        spade: () => this.btn_spade,
        club: () => this.btn_club,
    };
    private defaultBtnStatus: IButtonStatus = {
        ok: {
            visible: () => false,
        },
        cancel: {
            visible: () => false,
        },
        over: {
            visible: () => false,
        },
        heart: {
            visible: () => false,
        },
        diamond: {
            visible: () => false,
        },
        spade: {
            visible: () => false,
        },
        club: {
            visible: () => false,
        },
    };
    public constructor() {
        super();
        this.addEventListener(egret.Event.COMPLETE, this.onComplete, this);
    }
    private onComplete() {
        this.btn_ok.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onOk, this);
        this.btn_cancel.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCancel, this);
        this.btn_over.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onOver, this);
        this.btn_heart.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSuit('heart'), this);
        this.btn_diamond.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSuit('diamond'), this);
        this.btn_spade.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSuit('spade'), this);
        this.btn_club.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSuit('club'), this);
    }
    private get buttonStatus() {
        return Game.room && Game.room.askingParam && Game.room.askingParam.btnStatus || this.defaultBtnStatus;
    }
    private onOk() {
        let buttonStatus = this.buttonStatus;
        buttonStatus.ok && buttonStatus.ok.onClick && buttonStatus.ok.onClick();
    }
    private onCancel() {
        let buttonStatus = this.buttonStatus;
        buttonStatus.cancel && buttonStatus.cancel.onClick ? (
            buttonStatus.cancel.onClick()
        ) : (
                UI.self.gameArea.cancelSelection()
            );
    }
    private onOver() {
        let buttonStatus = this.buttonStatus;
        buttonStatus.over && buttonStatus.over.onClick && buttonStatus.over.onClick();
    }
    private onSuit(suit: string) {
        let buttonStatus = this.buttonStatus;
        buttonStatus[suit] && buttonStatus[suit].onClick && buttonStatus[suit].onClick();
    }
    public refreshButtonStatus() {
        let buttonStatus = this.buttonStatus;
        Object.keys(buttonStatus).forEach((k) => {
            let btn = this.btnMap[k]();
            buttonStatus[k].visible && (
                btn.visible = buttonStatus[k].visible()
            );
            buttonStatus[k].enabled && (
                btn.enabled = buttonStatus[k].enabled()
            );
        });
    }
}
