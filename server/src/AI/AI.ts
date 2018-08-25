import IResponse from '../IResponse';
import serverRoom from '../Room';
import AIUser from './AIUser';
import SelfPlayer from './virtual-client/SelfPlayer';
class AI {
    public static CardSampleSize = 1;
    public static ResposeSampleSize = 1;
    public static makeVirtualRoom(originalRoom: serverRoom, seatID: number, attach?: IResponse): Promise<SelfPlayer> {
        return new Promise((resolve) => {
            let room = new serverRoom(true);
            let map = new Map();
            originalRoom.players.forEach(player => {
                map.set(player.user, player);
            });
            room.users = originalRoom.users.map(user => {
                let player = map.get(user);
                let recordUser = new AIUser(room);
                recordUser.robot.room.usedRecord = [...player.socket.record];
                player.seatID == seatID && attach && recordUser.robot.room.usedRecord.push(attach);
                recordUser.robot.room.askCallback = (selfPlayer: SelfPlayer) => {
                    if (selfPlayer.seatID == seatID) {
                        resolve(selfPlayer);
                    }
                };
                return recordUser;
            });
            room.beginGame(originalRoom);
        });
    }
}

export default AI;
