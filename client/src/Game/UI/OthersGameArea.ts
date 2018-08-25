class OthersGameArea extends eui.Component {
    public generalAreas: OthersGeneralArea[] = [];
    public group_hidden: eui.Group;
    public constructor() {
        super();
        this.once(egret.Event.COMPLETE, this.onComplete, this);
    }
    public initGeneralAreas(playerCount: number) {
        this.generalAreas.forEach(generalArea => {
            UI.others.gameArea.removeChild(generalArea);
        });
        this.generalAreas = [];
        for (let i = 0; i < playerCount - 1; i++) {
            let generalArea = new OthersGeneralArea();
            generalArea.skinName = 'OthersGeneralAreaSkin';
            this.generalAreas.push(generalArea);
            if (playerCount == 2) {
                if (i == 0) {
                    generalArea.y = 16;
                    generalArea.horizontalCenter = 0;
                }
            } else if (playerCount == 8) {
                if (i == 0) {
                    generalArea.y = 246;
                    generalArea.horizontalCenter = 381.5;
                } else if (i == 1) {
                    generalArea.y = 87;
                    generalArea.horizontalCenter = 381.5;
                } else if (i == 2) {
                    generalArea.y = 16;
                    generalArea.horizontalCenter = 196.5;
                } else if (i == 3) {
                    generalArea.y = 16;
                    generalArea.horizontalCenter = 0;
                } else if (i == 4) {
                    generalArea.y = 16;
                    generalArea.x = 205;
                } else if (i == 5) {
                    generalArea.y = 87;
                    generalArea.x = 21;
                } else if (i == 6) {
                    generalArea.y = 246;
                    generalArea.x = 21;
                }
            }
            this.addChild(generalArea);
        }
    }
    private onComplete() {
        this.group_hidden.visible = false;
    }
}