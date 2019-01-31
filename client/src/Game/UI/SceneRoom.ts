class SceneRoom extends eui.Component {
	private static _instance: SceneRoom;

	public lb_roomInfo: eui.Label;
	public btn_leaveRoom: eui.Button;
	public _roomInfo: any;

	public static get instance(): SceneRoom {
		if (SceneRoom._instance == null) {
			SceneRoom._instance = new SceneRoom();
		}
		return SceneRoom._instance;
	}
	public constructor() {
		super();
        this.addEventListener(egret.Event.COMPLETE, this.onComplete, this);
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAdded, this);
        this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemoved, this);
		this.skinName = 'SceneRoomSkin';
	}
	protected childrenCreated(): void {
		super.childrenCreated();
	}
    private onComplete() {
		Game.socket.on('join room', data => {
			if (!data.self) {
				let roomInfo = this.roomInfo;
				roomInfo.playerCount += 1;
				this.roomInfo = roomInfo;
			}
		});
		Game.socket.on('leave room', self => {
			if (self) {
				let child = UI.sceneGame.parent ? UI.sceneGame : this;
				child.parent.addChild(UI.sceneLobby);
				child.parent.removeChild(child);
			} else {
				let roomInfo = this.roomInfo;
				roomInfo.playerCount -= 1;
				this.roomInfo = roomInfo;
			}
		});
	}
    private onAdded() {
		this.btn_leaveRoom.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onLeaveRoom, this);
	}
	private onRemoved() {
		this.btn_leaveRoom.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onLeaveRoom, this);
	}
	private refreshRoomInfo(roomInfo: any) {
		this.lb_roomInfo.text = `${roomInfo.roomID}   (${roomInfo.playerCount}/${roomInfo.maxPlayerCount})`;
	}
    public get roomInfo(): any {
        return this._roomInfo;
    }
    public set roomInfo(roomInfo: any) {
        this._roomInfo = roomInfo;
		if (this.lb_roomInfo) {
			this.refreshRoomInfo(roomInfo);
		}
    }
	private onLeaveRoom() {
        Game.socket.emit('leave room');
	}
}