import IUser from '../IUser';
import Player from '../Player';
import Room from '../Room';
import AIServerSocket from './AIServerSocket';
import Robot from './virtual-client/Robot';
class AIUser implements IUser {
    public socket: AIServerSocket = new AIServerSocket();
    public robot: Robot = this.socket.robot;
    public room: Room;
    constructor(room: Room) {
        this.room = room;
        this.robot.serverRoom = room;
    }
}
export default AIUser;
