export class KgRegisterSettings {
  static init() {
    // Register system settings
    game.settings.register("kamigakari", "talentClassify", {
        name: "SETTINGS.TalentClassify",
        hint: "SETTINGS.TalentClassifyDesc",
        scope: "client",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("kamigakari", "rollAddon", {
        name: "SETTINGS.RollAddon",
        hint: "SETTINGS.RollAddonDesc",
        scope: "client",
        type: Boolean,
        default: false,
        config: true
    });
    
    game.settings.register("kamigakari", "autoSpiritDiceCharge", {
		name: "SETTINGS.AutoSpiritDiceCharge",
		hint: "SETTINGS.AutoSpiritDiceChargeDesc",
		scope: "world",
		type: Boolean,
		default: true,
		config: true
    });
    
    game.settings.register("kamigakari", "startTimingDialog", {
		name: "SETTINGS.StartTimingDialog",
		hint: "SETTINGS.StartTimingDialogDesc",
		scope: "client",
		type: Boolean,
		default: true,
		config: true
    });
    
    game.settings.register("kamigakari", "endTimingDialog", {
		name: "SETTINGS.EndTimingDialog",
		hint: "SETTINGS.EndTimingDialogDesc",
		scope: "client",
		type: Boolean,
		default: true,
		config: true
    });
    
    game.settings.register("kamigakari", "mainTimingDialog", {
		name: "SETTINGS.MainTimingDialog",
		hint: "SETTINGS.MainTimingDialogDesc",
		scope: "client",
		type: Boolean,
		default: true,
		config: true
    });

  }
}
