class SceneLobby extends eui.Component {
	private static _instance: SceneLobby;

	public list_roomList: eui.List;
	public btn_refreshRoomList: eui.Button;
	public btn_joinRoom: eui.Button;
	public btn_createRoom: eui.Button;

	public static get instance(): SceneLobby {
		if (SceneLobby._instance == null) {
			SceneLobby._instance = new SceneLobby();
		}
		return SceneLobby._instance;
	}
	public constructor() {
		super();
        this.addEventListener(egret.Event.COMPLETE, this.onComplete, this);
		this.skinName = 'SceneLobbySkin';
	}
	protected childrenCreated(): void {
		super.childrenCreated();
	}
    private onComplete() {
		this.btn_refreshRoomList.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onRefreshRoomList, this);
		this.btn_joinRoom.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onJoinRoom, this);
		this.btn_createRoom.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onCreateRoom, this);
		Game.socket.on('join room', data => {
			if (data.self) {
				UI.sceneRoom.roomInfo = data.roomInfo;
				this.parent.addChild(UI.sceneRoom);
				this.parent.removeChild(this);
			}
		});
		this.refreshRoomList();
	}
	private refreshRoomList() {
		Game.socket.once('room list', allRoomInfo => {
			this.list_roomList.dataProvider = new eui.ArrayCollection(allRoomInfo);
		});
		Game.socket.emit('get room list');
	}
	private onRefreshRoomList() {
		this.refreshRoomList();
	}
	private onJoinRoom() {
		let roomInfo = this.list_roomList.selectedItem;
		if (roomInfo) {
        	Game.socket.emit('join room', roomInfo.roomID);
		}
	}
	private onCreateRoom() {
        Game.socket.emit('create room');
	}
}