import ServerRoom from '../../Room';
import AIServerSocket from '../AIServerSocket';
import Room from './Room';

class Robot {
    public room: Room;
    public serverRoom!: ServerRoom;
    constructor(serverSocket: AIServerSocket) {
        this.room = new Room(this, serverSocket);
    }
}

export default Robot;
