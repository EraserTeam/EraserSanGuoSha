class UI {
    public static get sceneLobby() {
        return SceneLobby.instance;
    }
    public static get sceneRoom() {
        return SceneRoom.instance;
    }
    public static get sceneGame() {
        return SceneGame.instance;
    }
    private static _self;
    public static get self(): ISelfUI {
        if (!UI._self)
            UI._self = {
                gameArea: UI.sceneGame.selfGameArea,
                generalArea: UI.sceneGame.selfGameArea.generalArea,
                operationArea: UI.sceneGame.operationArea,
            };
        return UI._self;
    }
    private static _others;
    public static get others(): IOthersUI {
        if (!UI._others)
            UI._others = {
                gameArea: UI.sceneGame.othersGameArea,
                generalArea: i => UI.sceneGame.othersGameArea.generalAreas[i],
            };
        return UI._others;
    }
    public static generalArea(seatID): GeneralArea {
        if (seatID == Game.room.selfPlayer.seatID) {
            return UI.self.generalArea;
        }
        return UI.others.generalArea(UI.getGeneralAreaIndex(seatID));
    }
    public static bigArea(seatID): BigArea {
        if (seatID == Game.room.selfPlayer.seatID) {
            return UI.self.gameArea;
        }
        return UI.others.generalArea(UI.getGeneralAreaIndex(seatID));
    }
    private static getGeneralAreaIndex(seatID) {
        let i: number;
        if (seatID > Game.room.selfPlayer.seatID) {
            i = seatID - Game.room.selfPlayer.seatID - 1;
        } else {
            i = Game.room.playerCount - (Game.room.selfPlayer.seatID - seatID) - 1;
        }
        return i;
    }
}
interface ISelfUI {
    gameArea: SelfGameArea;
    generalArea: SelfGeneralArea;
    operationArea: OperationArea;
}
interface IOthersUI {
    gameArea: OthersGameArea;
    generalArea: (i) => OthersGeneralArea;
}
type GeneralArea = SelfGeneralArea | OthersGeneralArea;
type BigArea = SelfGameArea | OthersGeneralArea;