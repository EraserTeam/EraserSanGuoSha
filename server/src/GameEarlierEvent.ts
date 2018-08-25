import Card from './Card';
enum GameEarlierEvent {
    DealCards, //分发初始卡牌
    DealIdentities, //分配身份
    ExtraMaxHP, //额外体力上限
    ExtraSkill, //额外技能
}
export default GameEarlierEvent;
const GameEarlierEventCanStop = (event: GameEarlierEvent, ret: any): boolean => {
    switch (event) {
        case GameEarlierEvent.DealIdentities:
            return true;
        default:
            return false;
    }
};
export { GameEarlierEventCanStop };
