import Game from './Game';
import GameEvent from './GameEvent';
import Interval from './Interval';
import Phase from './Phase';
import Player from './Player';
import Zone from './Zone';
class Round {
    public player: Player;
    public static defaultPhases: Phase[] = [
        Phase.Prepare,
        Phase.Judge,
        Phase.Draw,
        Phase.Play,
        Phase.Discard,
        Phase.Over,
    ];
    public phases!: Phase[];
    private _phaseIndex: number = -1;
    public giveUpDrawCards: boolean = false;
    constructor(player: Player) {
        this.player = player;
        this.initPhases();
    }
    public initPhases() {
        this.phases = Round.defaultPhases.slice();
    }
    public get phase(): Phase {
        return this.phases[this.phaseIndex];
    }
    public async begin(): Promise<void> {
        this.player.room.sockets.emit('round begin');
        await this.player.room.events.emit(GameEvent.RoundBegin, this.player);
        this.next();
    }
    /**
     * - 进入该回合的下一个阶段。
     * - 在当前回合最后一个阶段结束，将要切换为下一个回合时，也必须得调用一次。
     */
    public async nextPhase(): Promise<boolean> {
        if (this.checkDeath())
            return true;
        let i = this.phaseIndex + 1;
        let bool = false;
        while (true) {
            let length = this.phases.length;
            if (i < length) {
                if (this.phases[i] != Phase.Prepare) {
                    if (bool == false) {
                        await this.player.room.events.emit(GameEvent.PhaseEnd, this.player, this.phase);
                        bool = true;
                    }
                    await this.player.room.events.emit(GameEvent.BeforePhaseBegin, this.player, this.phases[i]);
                }
                if (length != this.phases.length)
                    continue;
                this.phaseIndex = i;
                await this.player.room.events.emit(GameEvent.PhaseBegin, this.player, this.phase);
                await this.phaseOperate();
                return true;
            } else {
                return false;
            }
        }
    }
    public next() {
        if (!this.player.alive) return;
        this.player.room.setTimeout(async () => {
            try {
                if (!await this.nextPhase()) {
                    await this.end();
                }
            } catch (e) {
                this.player.room.catchError(e);
            }
        }, Interval.Phase);
    }
    public get phaseIndex(): number {
        return this._phaseIndex;
    }
    public set phaseIndex(index: number) {
        this._phaseIndex = index;
        this.player.room.sockets.emit('set phase', {
            phase: this.phase,
        });
    }
    private async phaseOperate() {
        if (this.phase == Phase.Prepare) {
            this.next();
        } else if (this.phase == Phase.Judge) {
            let judgeZone = this.player.judgeZone;
            if (judgeZone.length > 0) {
                let room = this.player.room;
                let n = 0;
                for (let i = judgeZone.length - 1; i >= n; i--) {
                    let card = judgeZone[i];
                    await card.move({
                        fromSeatID: this.player.seatID,
                        fromZone: Zone.Judge,
                        toZone: Zone.Dispose,
                    });
                    await room.cardEffect(card, undefined, [], [], this.player);
                    if (card.class.rotate) {
                        let players = Game.sortPlayersBySeatNum(room.alivePlayers, this.player);
                        players.push(...players.splice(0, 1));
                        let i = 0;
                        for (; i < players.length; i++) {
                            if (!players[i].hasCardClassInJudgeZone(card.class.name)) {
                                break;
                            }
                        }
                        await card.move({
                            fromZone: Zone.Dispose,
                            toSeatID: players[i].seatID,
                            toZone: Zone.Judge,
                        });
                    } else {
                        await card.move({
                            fromZone: Zone.Dispose,
                            toZone: Zone.DiscardPile,
                        });
                    }
                }
            }
            this.next();
        } else if (this.phase == Phase.Draw) {
            if (!this.giveUpDrawCards) {
                let n = 2;
                await this.player.room.events.callbackEmit(GameEvent.CalcDrawPhaseCardCount, async (listener) => {
                    let ret = await listener(this.player, n);
                    if (typeof ret == 'undefined')
                        return;
                    n = ret;
                });
                await this.player.drawCards(n);
            }
            this.giveUpDrawCards = false;
            this.next();
        } else if (this.phase == Phase.Play) {
            await this.player.askPlayCard();
        } else if (this.phase == Phase.Discard) {
            let delta = this.player.hand.length - this.player.HP;
            if (delta > this.player.hand.length) delta = this.player.hand.length;
            if (delta > 0) {
                await this.player.askDiscard('', {
                    minCount: delta,
                    maxCount: delta,
                });
                this.next();
            } else {
                this.next();
            }
        } else if (this.phase == Phase.Over) {
            this.next();
        }
    }
    public async skipPhase(phase: Phase) {
        for (let i = this.phaseIndex + 1; i < this.phases.length; i++) {
            if (this.phases[i] == phase) {
                this.phases.splice(i, 1);
                i--;
            }
        }
    }
    private async end() {
        await this.player.room.nextRound();
    }
    public checkDeath(): boolean {
        if (!this.player.alive) {
            this.player.room.nextRound();
            return true;
        }
        return false;
    }
}
export default Round;
