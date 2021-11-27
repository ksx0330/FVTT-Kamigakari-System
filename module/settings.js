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
      type: String,
      choices: {
        "available": "SETTINGS.AvailableTimingChoice",
        "always": "SETTINGS.AlwaysTimingChoice",
        "none": "SETTINGS.NoneTimingChoice"
      },
      default: "available",
      config: true
    });
    
    game.settings.register("kamigakari", "endTimingDialog", {
      name: "SETTINGS.EndTimingDialog",
      hint: "SETTINGS.EndTimingDialogDesc",
      scope: "client",
      type: String,
      choices: {
        "available": "SETTINGS.AvailableTimingChoice",
        "always": "SETTINGS.AlwaysTimingChoice",
        "none": "SETTINGS.NoneTimingChoice"
      },
      default: "available",
      config: true
    });

    game.settings.register("kamigakari", "defenseTimingDialog", {
      name: "SETTINGS.DefenseTimingDialog",
      hint: "SETTINGS.DefenseTimingDialogDesc",
      scope: "client",
      type: String,
      choices: {
        "available": "SETTINGS.AvailableTimingChoice",
        "always": "SETTINGS.AlwaysTimingChoice",
        "none": "SETTINGS.NoneTimingChoice"
      },
      default: "available",
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

    game.settings.register("kamigakari", "talentBar", {
      name: "SETTINGS.TalentBar",
      hint: "SETTINGS.TalentBarDesc",
      scope: "client",
      type: Boolean,
      default: true,
      config: true,
      onChange: () => {
        location.reload();
      }
    });

  }
}
