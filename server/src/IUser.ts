import OriginalSocket from './OriginalSocket';
import Room from './Room';
interface IUser {
    room: Room | undefined;
    socket: OriginalSocket;
}

export default IUser;
