class Sound {
    private static bgm: egret.Sound;
    private static bgm_channel: egret.SoundChannel;
    private static sounds: any = {};
    private static link(name: string): string {
        let link = RES.getRes('SoundLink_json');
        return link[name] || name;
    }
    private static hasSound(name: string) {
        return RES.hasRes(`${Sound.link(name)}_mp3`);
    }
    private static getSound(name: string) {
        return RES.getRes(`${Sound.link(name)}_mp3`);
    }
    public static playBGM() {
        if (!Sound.bgm)
            Sound.bgm = Sound.getSound('bgm');
        Sound.bgm_channel = Sound.bgm.play();
        Sound.bgm_channel.volume = 0.5;
    }
    public static stopBGM() {
        if (Sound.bgm_channel) {
            Sound.bgm_channel.stop();
        }
    }
    public static playSound(name: string) {
        if (!Sound.sounds[name]) {
            if (!Sound.hasSound(name))
                return;
            Sound.sounds[name] = {
                sound: Sound.getSound(name),
            };
        }
        Sound.sounds[name].channel = Sound.sounds[name].sound.play(0, 1);
    }
    public static stopSound(name: string) {
        if (Sound.sounds[name].channel) {
            Sound.sounds[name].channel.stop();
        }
    }
    public static playCardSound(sex: Sex, cardClassName: string) {
        Sound.playSound(`${Game.getSexName(sex)}_${cardClassName}`);
    }
    public static stopCardSound(sex: Sex, cardClassName: string) {
        Sound.stopSound(`${Game.getSexName(sex)}_${cardClassName}`);
    }
    public static playSkillSound(skillName: string) {
        let name = `Skill_${skillName}`;
        if (!Sound.sounds[name]) {
            if (!Sound.hasSound(name)) {
                let i: number;
                for (i = 0; ; i++) {
                    name = `Skill_${skillName}_${i + 1}`;
                    if (!Sound.hasSound(name)) {
                        break;
                    }
                }
                if (i > 0)
                    Sound.sounds[name] = i;
            }
        }
        if (typeof Sound.sounds[name] == 'number') {
            let random = Util.random(1, Sound.sounds[name]);
            name = `Skill_${skillName}_${random}`;
        }
        Sound.playSound(name);
    }
    public static stopSkillSound(skillName: string) {
        let name = `Skill_${skillName}`;
        if (typeof Sound.sounds[name] == 'number') {
            for (let i = 1; i <= Sound.sounds[name]; i++) {
                Sound.stopSound(`Skill_${skillName}_${i}`);
            }
        } else {
            Sound.stopSound(name);
        }
    }
    public static playDeadSound(general: IGeneral) {
        Sound.playSound(`${general.name}_Dead`);
    }
    public static stopDeadSound(general: IGeneral) {
        Sound.stopSound(`${general.name}_Dead`);
    }
}