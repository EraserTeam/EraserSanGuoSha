enum GameSyncEvent {
    HasSkill, //判断是否拥有技能时
    CalcDistance, //计算距离时
    LimitUseCount, //判断是否限制使用次数时
    LimitDistance, //判断是否限制距离时
    CalcExtraMaxTargetCount, //计算额外目标数上限时
    IgnoreArmor, //无视防具
    ArmorInvalid, //防具无效
    CanAnswerCard, //能否响应卡牌 server
    CalcRecoverNumber, //计算回复体力的数值 server
}
let SyncGameEventCanStop = (event: GameSyncEvent, ret: any): boolean => {
    switch (event) {
        case GameSyncEvent.HasSkill:
        case GameSyncEvent.IgnoreArmor:
            return !!ret;
        case GameSyncEvent.LimitUseCount:
        case GameSyncEvent.LimitDistance:
        case GameSyncEvent.ArmorInvalid:
        case GameSyncEvent.CanAnswerCard:
            return !ret;
        default:
            return false;
    }
};