import SocketIO = require('socket.io');
import AISocket from './AI/AIServerSocket';
type OriginalSocket = SocketIO.Socket | AISocket;
export default OriginalSocket;
