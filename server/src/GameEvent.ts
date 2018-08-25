import Card from './Card';
enum GameEvent {
    GameBegin, //游戏开始时
    RoundBegin, //回合开始时
    BeforePhaseBegin, //两个阶段之间
    PhaseBegin, //阶段开始时
    PhaseEnd, //阶段结束时
    RoundEnd, //回合结束时
    AfterRoundEnd, //回合结束后
    NeedUseCard, //需要使用卡牌时
    NeedRespondCard, //需要打出卡牌时
    UseCard, //使用卡牌时
    SetTarget, //指定目标时
    BecomeTarget, //成为目标时
    AfterSetTarget, //指定目标后
    AfterBecomeTarget, //成为目标后
    $BeforeCallCardEffect, //调用卡牌生效前
    SetInvalidTarget, //设定无效目标
    BeforeCardEffect, //卡牌生效前
    CardBeCounteracted, //卡牌被抵消
    CardEffect, //卡牌生效时
    UseCardEnd, //使用结算结束时
    AfterUseCardEnd, //使用结算结束后
    $BeforeCallDamaged, //调用被伤害前
    BeforeDamageBegin, //伤害结算开始前
    DamageBegin, //伤害结算开始时
    Damage, //造成伤害时
    Damaged, //受到伤害时
    AfterDamage, //造成伤害后
    AfterDamaged, //受到伤害后
    DamageEnd, //伤害结算结束时
    LoseHP, //失去体力时
    AfterLoseHP, //失去体力后
    BeforeReduceHP, //扣减体力前
    ReduceHP, //扣减体力时
    AfterReduceHP, //扣减体力后
    BeforeRecover, //回复体力前
    AfterRecover, //回复体力后
    GetDying, //进入濒死状态时
    Dying, //处于濒死状态时
    AfterDying, //濒死结算结束后
    BeforeDie, //死亡结算开始前
    BeforeConfirmInfo, //确认信息前
    AfterConfirmInfo, //确认信息后
    Die, //死亡时
    RewardMurderer, //对杀死死亡角色的角色进行奖惩
    AfterDie, //死亡后
    $BeforeCallUseSkill, //调用使用技能前
    BeforeMoveCard, //卡牌移至目标区域前
    AfterMoveCard, //卡牌移至目标区域后
    CalcDrawPhaseCardCount, //计算摸牌阶段摸牌数
}
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
export default GameEvent;
export { GameSyncEvent };
const GameEventCanStop = (event: GameEvent, ret: any): boolean => {
    switch (event) {
        case GameEvent.BeforeCardEffect:
            return typeof ret != 'undefined' && (!ret || ret && ret.effect === false && ret.counteractingCard instanceof Card);
        case GameEvent.Dying:
        case GameEvent.NeedUseCard:
        case GameEvent.NeedRespondCard:
        case GameEvent.CardBeCounteracted:
        case GameEvent.BeforeDamageBegin:
            return ret;
        case GameEvent.Damage:
        case GameEvent.Damaged:
            return ret <= 0;
        case GameEvent.$BeforeCallCardEffect:
        case GameEvent.$BeforeCallUseSkill:
            return true;
        default:
            return false;
    }
};
const SyncGameEventCanStop = (event: GameSyncEvent, ret: any): boolean => {
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
export { GameEventCanStop };
export { SyncGameEventCanStop };
