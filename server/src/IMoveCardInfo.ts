import Card from './Card';
import Player from './Player';
import Zone from './Zone';

interface IMoveCardInfo {
    fromPlayer?: Player;
    toPlayer?: Player;
    fromZone: Zone;
    toZone: Zone;
    card: Card;
}
export default IMoveCardInfo;
