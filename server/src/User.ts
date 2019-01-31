import SocketIO = require('socket.io');
import IUser from './IUser';
import Room from './Room';
class User implements IUser {
    public static all: User[] = [];
    public socket: SocketIO.Socket;
    public roomID!: number;
    private deleted: boolean = false;
    constructor(socket: any) {
        User.all.push(this);
        this.socket = socket;
    }
    public static delete(user: User) {
        user.deleted = true;
        user.leaveRoom();
        for (let i = 0; i < User.all.length; i++) {
            if (user == User.all[i]) {
                User.all.splice(i, 1);
                break;
            }
        }
    }
    public joinRoom(roomID: number) {
        this.roomID = roomID;
        let room = this.room as Room;
        room.users.push(this);
        this.socket.join(`room ${this.roomID}`);
        console.log(`a user join room: ${this.roomID}`);
        this.socket.emit('join room', {
            self: true,
            roomInfo: {
                roomID: room.id,
                playerCount: room.playerCount,
                maxPlayerCount: room.maxPlayerCount,
            },
        });
        this.sameRoomOthers.emit('join room', {
            self: false,
        });
        if (room) {
            if (room.users.length >= room.maxPlayerCount) {
                room.beginGame();
            }
        }
    }
    public leaveRoom() {
        if (!this.roomID) return;
        this.socket.leave(`room ${this.roomID}`);
        let room = this.room;
        if (room) {
            for (let i = 0; i < room.users.length; i++) {
                if (this == room.users[i]) {
                    room.users.splice(i, 1);
                    break;
                }
            }
        }
        console.log(`a user leave room: ${this.roomID}`);
        this.roomID = 0;
        this.sameRoom.emit('leave room', false);
        if (!this.deleted) {
            this.socket.emit('leave room', true);
        }
        if (room && room.playerCount == 0) {
            Room.delete(room);
        }
    }
    public get room(): Room | undefined {
        return Room.getRoom(this.roomID);
    }
    public get sameRoom(): any {
        return this.socket.in(`room ${this.roomID}`);
    }
    public get sameRoomOthers(): any {
        return this.socket.broadcast.in(`room ${this.roomID}`);
    }
}
export default User;
