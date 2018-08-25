class Player {
    public hand: Card[] = [];
    public judgeZone: Card[] = [];
    public equipZone: Array<Card | undefined> = [undefined, undefined, undefined, undefined];
    public seatID: number = -1;
    protected _seatNum: number = -1;
    protected _maxHP: number = 0;
    protected _HP: number = 0;
    protected _alive: boolean = true;
    protected _selected: boolean = false;
    protected _cannotSelect: boolean = false;
    protected _dark: boolean = false;
    public skills: Skill[] = [];
    protected flag: any = {};
    private _general: IGeneral = undefined as any;
    private _name: string = undefined as any;
    private _country: Country = undefined as any;
    private _sex: Sex = undefined as any;
    private _identity: Identity = undefined as any;
    private _back: boolean = false;
    protected get self() {
        return false;
    }
    protected handCardsChange() {
        this.bigArea.cardCountLabel.lb_cardCount.text = this.hand.length.toString();
    }
    public addHandCards(cards: Card[]) {
        this.hand.push(...cards);
        this.handCardsChange();
    }
    public removeHandCards(cards: Card[]) {
        if (this.self)
            this.hand = this.hand.filter(e => !cards.includes(e));
        else
            this.hand.splice(0, cards.length);
        this.handCardsChange();
    }
    public addToJudgeZone(cards: Card[]) {
        this.judgeZone.push(...cards);
        cards.forEach(card => {
            this.bigArea.addToJudgeZoneUI(card.class.name);
        });
    }
    public removeFromJudgeZone(cards: Card[]) {
        cards.forEach(card => {
            let i = this.judgeZone.findIndex(e => e.class.name == card.class.name);
            if (~i)
                this.judgeZone.splice(i, 1);
            this.bigArea.removeFromJudgeZoneUI(card.class.name);
        });
    }
    public setEquip(equipType: EquipType, card: Card | undefined) {
        this.equipZone[equipType] = card;
        let allEquipUI = this.bigArea.equipUI;
        let equipUI = allEquipUI[equipType];
        if (card) {
            equipUI.equip = card;
            equipUI.visible = true;
            egret.Tween.removeTweens(equipUI);
            if (this.self) {
                equipUI.x = -equipUI.width;
                egret.Tween.get(equipUI).to({ x: 7 }, 300);
            } else {
                equipUI.y = equipUI.y - 4;
                egret.Tween.get(equipUI).to({ y: 84 + 10 * equipType }, 300);
            }
        } else {
            equipUI.visible = false;
        }
    }
    public hasEquipType(equipType: EquipType): boolean {
        return typeof this.equipZone[equipType] != 'undefined';
    }
    public hasEquip(equipClass: string): boolean {
        return this.equipZone.some(card => !!(card && card.class.name == equipClass));
    }
    public hasCardClassInJudgeZone(cardClass: string): boolean {
        return this.judgeZone.some(card => card.class.name == cardClass);
    }
    public get room() {
        return Game.room;
    }
    public get generalArea(): GeneralArea {
        return UI.generalArea(this.seatID);
    }
    public get HPArea(): any {
        return this.generalArea.HPArea;
    }
    public get bigArea(): BigArea {
        return UI.bigArea(this.seatID);
    }
    public get seatNum(): number {
        return this._seatNum;
    }
    public set seatNum(seatNum: number) {
        this._seatNum = seatNum;
        this.generalArea.seatNum = seatNum;
    }
    public get maxHP(): number {
        return this._maxHP;
    }
    public set maxHP(maxHP: number) {
        this._maxHP = maxHP;
        this.HPArea.maxHP = maxHP;
    }
    public get HP(): number {
        return this._HP;
    }
    public set HP(HP: number) {
        this._HP = HP;
        this.HPArea.HP = HP;
    }
    public get alive(): boolean {
        return this._alive;
    }
    public set alive(alive: boolean) {
        this._alive = alive;
        this.bigArea.alive = alive;
    }
    public get general(): IGeneral {
        return this._general;
    }
    public set general(general: IGeneral) {
        this._general = general;
        this.generalArea.general = general;
        this.name = general.tipName;
    }
    public get name(): string {
        return this._name;
    }
    public set name(name: string) {
        this._name = name;
        this.generalArea.name = name;
    }
    public get country(): Country {
        return this._country;
    }
    public set country(country: Country) {
        this._country = country;
        this.bigArea.country = country;
    }
    public get sex(): Sex {
        return this._sex;
    }
    public set sex(sex: Sex) {
        this._sex = sex;
    }
    public get identity(): Identity {
        return this._identity;
    }
    public set identity(identity: Identity) {
        this._identity = identity;
        this.bigArea.identity = identity;
    }
    public get back(): boolean {
        return this._back;
    }
    public set back(back: boolean) {
        this._back = back;
        this.generalArea.back = back;
    }
    public get front(): boolean {
        return !this.back;
    }
    public get wounded() {
        return this.HP < this.maxHP;
    }
    public getFlag(key: string): any {
        return this.flag[key];
    }
    public setFlag(key: string, value: any) {
        this.flag[key] = value;
    }
    public get equipZoneCards(): Card[] {
        return this.equipZone.filter(card => card) as Card[];
    }
    public get selected(): boolean {
        return this._selected;
    }
    public set selected(selected: boolean) {
        this._selected = selected;
        this.generalArea.img_selected.visible = selected;
    }
    public get cannotSelect(): boolean {
        return this._cannotSelect;
    }
    public set cannotSelect(cannotSelect: boolean) {
        this._cannotSelect = cannotSelect;
        if (cannotSelect) {
            this.generalArea.componentToSelect.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onSelected, this);
        } else {
            this.generalArea.componentToSelect.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onSelected, this);
        }
    }
    public get dark(): boolean {
        return this._dark;
    }
    public set dark(dark: boolean) {
        this._dark = dark;
        this.generalArea.img_dark.visible = dark;
    }
    private onSelected() {
        this.selected = !this.selected;
        if (this.selected) {
            this.room.selectedPlayers.push(this);
        } else {
            let i = this.room.selectedPlayers.indexOf(this);
            if (~i)
                this.room.selectedPlayers.splice(i, 1);
        }
        UI.self.operationArea.refreshButtonStatus();
        UI.sceneGame.refreshPlayerSelect();
    }
    public refreshPhase() {
        let source: string = '';
        let phase = this.room.round.phase;
        if (this.room.round.player == this) {
            if (this.room.round.phase == Phase.Prepare) {
                source = 'RoundBegin_png';
            } else if (this.room.round.phase == Phase.Judge) {
                source = 'JudgePhase_png';
            } else if (this.room.round.phase == Phase.Draw) {
                source = 'DrawPhase_png';
            } else if (this.room.round.phase == Phase.Play) {
                source = 'PlayPhase_png';
            } else if (this.room.round.phase == Phase.Discard) {
                source = 'DiscardPhase_png';
            } else if (this.room.round.phase == Phase.Over) {
                source = 'OverPhase_png';
            } else if (this.room.round.began) {
                source = 'RoundBegin_png';
            }
            if (this.self) {
                if (source != '') {
                    source = `Self${source}`;
                }
            }
        }
        let img = this.bigArea.img_phase;
        if (img && img.source != source) {
            img.source = source;
            if (this.self) {
                img.x = 0;
                egret.Tween.get(img).to({ x: 50 }, 350);
            } else {
                img.horizontalCenter = -35;
                egret.Tween.get(img).to({ horizontalCenter: 0 }, 350);
            }
        }
    }
    public getSkill(skill: Skill): void;
    public getSkill(skillName: string): void;
    public getSkill(skill: Skill | string) {
        if (typeof skill == 'string')
            skill = new Skill(skill);
        if (this.hasSkill(skill.name))
            return;
        this.skills.push(skill);
    }
    public hasSkill(skillName: string) {
        let hasSkill = this.skills.some(skill => skill.name == skillName);
        if (hasSkill)
            return true;
        return this.room.syncEvents.emit(GameSyncEvent.HasSkill, this, skillName);
    }
    public get hasCard(): boolean {
        return this.hand.length > 0 || this.equipZoneCards.length > 0;
    }
    public get hasZoneCard(): boolean {
        return this.hand.length > 0 || this.equipZoneCards.length > 0 || this.judgeZone.length > 0;
    }
    public distanceTo(toPlayer: Player): number {
        let distance: number;
        if (toPlayer == this)
            distance = 0;
        else {
            distance = this.calcDistanceBySeatNum(toPlayer);
            this.room.syncEvents.callbackEmit(GameSyncEvent.CalcDistance, listener => {
                let ret = listener(this, toPlayer, distance);
                if (typeof ret == 'undefined')
                    return;
                distance = ret;
                if (distance < 1)
                    distance = 1;
            });
        }
        return distance;
    }
    private calcDistanceBySeatNum(toPlayer: Player): number {
        let players = Game.sortPlayersBySeatNum(this.room.alivePlayers, this);
        let [fromIndex, toIndex] = [players.indexOf(this), players.indexOf(toPlayer)];
        if (fromIndex == -1)
            throw new Error('Cannot find fromPlayer.Maybe he was dead.');
        if (toIndex == -1)
            throw new Error('Cannot find toIndex.Maybe he was dead.');
        let distanceCCW = toIndex - fromIndex;
        let distanceCW = players.length - distanceCCW;
        return distanceCW < distanceCCW ? distanceCW : distanceCCW;
    }
    public get attackRange(): number {
        let arm = this.equipZone[EquipType.Arm];
        if (!arm)
            return 1;
        else {
            let attackRange = arm.class.attackRange;
            if (typeof attackRange == 'undefined')
                attackRange = 1;
            return attackRange;
        }
    }
    public inAttackRange(ofPlayer: Player): boolean {
        if (ofPlayer == this)
            return false;
        return ofPlayer.attackRange >= ofPlayer.distanceTo(this);
    }
    public limitUseCount(card: Card): boolean {
        let bool = true;
        this.room.syncEvents.callbackEmit(GameSyncEvent.LimitUseCount, listener => {
            let ret = listener(this, card);
            if (typeof ret != 'undefined')
                bool = ret;
        });
        return bool;
    }
    public limitDistance(card: Card): boolean {
        let bool = true;
        this.room.syncEvents.callbackEmit(GameSyncEvent.LimitDistance, listener => {
            let ret = listener(this, card);
            if (typeof ret != 'undefined')
                bool = ret;
        });
        return bool;
    }
    public extraMaxTargetCount(card: Card): number {
        let n = 0;
        this.room.syncEvents.callbackEmit(GameSyncEvent.CalcExtraMaxTargetCount, listener => {
            let ret = listener(this, card, n);
            if (typeof ret != 'undefined')
                n = ret;
        });
        return n;
    }
    public cardFilterSelect(card: Card, selected: Player[], targets: Player[]): Player[] {
        if (!card.class.filterSelect) return [];
        let players = targets.filter(player =>
            !(
                card.class.type == CardType.Bag &&
                card.class.delay &&
                player.hasCardClassInJudgeZone(card.class.name)
            ),
        );
        return card.class.filterSelect(card, this, selected, players);
    }
    public cardSelectCorrectly(card: Card, selected: Player[]): boolean {
        for (let player of selected) {
            if (!player.alive) return false;
            if (card.class.type == CardType.Bag && card.class.delay && player.hasCardClassInJudgeZone(card.class.name)) return false;
        }
        let players = this.room.alivePlayers;
        for (let i = 0; i < selected.length - 1; i++) {
            let currentSelected = selected.slice(0, i);
            let targets = players.filter(player => !currentSelected.includes(player));
            if (!this.cardFilterSelect(card, currentSelected, targets).includes(selected[i]))
                return false;
        }
        return card.class.selectCorrectly(card, this, selected);
    }
    public cardEnabled(card: Card) {
        return card.class.enabled(card, this);
    }
}