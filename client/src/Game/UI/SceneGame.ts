class SceneGame extends eui.Component {
    private static _instance: SceneGame;

    public selfGameArea: SelfGameArea;
    public othersGameArea: OthersGameArea;
    public operationArea: OperationArea;
    public disposeZoneUI: CardUI[] = []; // disponseZone 462 * 82 x:240 y:229
    public globalCardSelectorWindow: GlobalCardSelectorWindow;
    public group_movingCards: eui.Group;
    public group_top: eui.Group;
    public lb_tip: eui.Label;

    public static get instance(): SceneGame {
        if (SceneGame._instance == null) {
            SceneGame._instance = new SceneGame();
        }
        return SceneGame._instance;
    }
    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onComplete, this);
        this.skinName = 'SceneGameSkin';
    }
    protected childrenCreated(): void {
        super.childrenCreated();
    }
    private onComplete() {
        this.lb_tip.filters = [GlowFilter.tipBorderGlow];
        Sound.playBGM();
    }
    public clearPlayerSelect() {
        Game.room.players.forEach(player => {
            player.dark = false;
            player.cannotSelect = true;
            player.selected = false;
        });
        Game.room.selectedPlayers = [];
    }
    private get filterSelect() {
        return Game.room && Game.room.askingParam && Game.room.askingParam.filterSelect;
    }
    public refreshPlayerSelect() {
        let cards = UI.self.gameArea.selectedCards;
        let selected: Player[] = Game.room.selectedPlayers;
        let targets: Player[] = Game.room.alivePlayers.filter(player => selected.every(e => e != player));
        let filterSelect = this.filterSelect;
        let players: Player[] | false;
        if (typeof filterSelect == 'function') {
            players = filterSelect(cards, Game.room.selfPlayer, selected, targets);
        } else if (typeof filterSelect == 'boolean') {
            players = false;
        } else {
            return;
        }
        if (players === false) {
            Game.room.players.forEach(player => {
                player.dark = false;
                player.cannotSelect = true;
            });
        } else {
            Game.room.players.forEach(player => {
                if ((players as Player[]).includes(player) || player.selected) {
                    player.dark = false;
                    player.cannotSelect = false;
                } else {
                    player.dark = player.alive;
                    player.cannotSelect = true;
                }
            });
        }
    }
    public refreshDisposeZoneUI() {
        let cnt = this.disposeZoneUI.length;
        let offset = 6;
        let width: number;
        let sum: number;
        let toX: number;
        let toY = 229;
        let width_all;
        let left;
        this.disposeZoneUI.slice().reverse().every((cardUI, i) => {
            width = width || cardUI.width;
            sum = sum || width + offset;
            if (cnt * sum <= 462) {
                width_all = width_all || cnt * sum - offset;
                left = left || 240 + 462 / 2 - width_all / 2;
                toX = left + i * sum;
            } else {
                let w = (462 - width) / (cnt - 1);
                toX = 240 + i * w;
            }
            if (!cardUI.toPoint || cardUI.toPoint.x != toX || cardUI.toPoint.y != toY) {
                cardUI.toPoint = { x: toX, y: toY };
                if (cardUI instanceof CardRendererWithBack && cardUI.rotate) {
                    cardUI.x = cardUI.toPoint.x;
                    cardUI.y = cardUI.toPoint.y;
                    cardUI.back.scaleX = 1;
                    cardUI.front.scaleX = 0;
                    egret.Tween.get(cardUI).to({ backScaleX: 0 }, 300).to({ frontScaleX: 1 }, 300);
                    cardUI.rotate = false;
                } else if (cardUI.tw_moving) {
                    let tw = cardUI.tw_moving;
                    cardUI.tw_moving = cardUI.tw_moving.call(() => cardUI.tw_moving = tw).to(cardUI.toPoint, 100).call(() => cardUI.tw_moving = undefined);
                } else {
                    cardUI.tw_moving = egret.Tween.get(cardUI).to(cardUI.toPoint, 300).call(() => cardUI.tw_moving = undefined);
                }
            }
            return true;
        });
    }
    public disappearFromDisposeZoneUI(cardIDs: number[]) {
        cardIDs.forEach(cardID => {
            for (let cardUI of this.disposeZoneUI) {
                if (cardUI.data.cardID == cardID) {
                    if (!cardUI.tw_disappearing) {
                        cardUI.data.dark = true;
                        cardUI.dark = 0;
                        cardUI.tw_disappearing = egret.Tween.get(cardUI);
                        cardUI.tw_disappearing.wait(1000).to({ dark: 0.8 }, 800);
                        cardUI.tw_disappearing.wait(1000).to({ alpha: 0 }, 1000);
                        cardUI.tw_disappearing.call(() => {
                            cardUI.tw_disappearing = undefined;
                            egret.Tween.removeTweens(cardUI);
                            if (this.group_movingCards.contains(cardUI))
                                this.group_movingCards.removeChild(cardUI);
                            let i = this.disposeZoneUI.indexOf(cardUI);
                            this.disposeZoneUI.splice(i, 1);
                            this.refreshDisposeZoneUI();
                        });
                    }
                }
            }
        });
    }
    private get tip() {
        return this.lb_tip.text;
    }
    private set tip(tip: string) {
        this.lb_tip.textFlow = (new egret.HtmlTextParser()).parser(tip);
        this.lb_tip.visible = !!tip;
    }
    public refreshTip() {
        let tip = Game.room.askingParam && Game.room.askingParam.tip;
        this.tip = tip ? tip() : '';
    }
}