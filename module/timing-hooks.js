import { TalentDialog } from "./dialog/talent-dialog.js";

export class TimingHooks {
    static init() {
        game.kamigakari.TimingDialog = this.setTimingDialogs();
        
        Hooks.on("showStart", async actor => {
            if (game.user.character == undefined)
                return;
                
            if (game.settings.get("kamigakari", "startTimingDialog") === "none" ||
               (game.settings.get("kamigakari", "startTimingDialog") !== "always" && !this.validate("Start")) ) {

                //let chatData = {"content": game.i18n.localize("KG.Start") + ": " + game.i18n.localize("KG.Action2")};
                //ChatMessage.create(chatData);
                return;
            }
            game.kamigakari.TimingDialog.start.render(true);
        });
        
        Hooks.on("showEnd", async actor => {
            if (game.user.character == undefined)
                return;
                
            if (game.settings.get("kamigakari", "endTimingDialog") === "none" ||
               (game.settings.get("kamigakari", "endTimingDialog") !== "always" && !this.validate("End")) ) {
                   
                //let chatData = {"content": game.i18n.localize("KG.End") + ": " + game.i18n.localize("KG.Action2")};
                //ChatMessage.create(chatData);
                return;
            }
            game.kamigakari.TimingDialog.end.render(true);
        });

        Hooks.on("showDefense", async actor => {
            if (game.user.character == undefined)
                return;
                
            if (game.settings.get("kamigakari", "defenseTimingDialog") === "none" ||
               (game.settings.get("kamigakari", "defenseTimingDialog") !== "always" && !this.validate("Defense")) ) {
                   
                //let chatData = {"content": game.i18n.localize("KG.Defense") + ": " + game.i18n.localize("KG.Action2")};
                //ChatMessage.create(chatData);
                return;
            }
            game.kamigakari.TimingDialog.defense.render(true);
        });

        Hooks.on("showPrep", async actor => {
            if (game.user.character == undefined)
                return;
                
            game.kamigakari.TimingDialog.prep.render(true);
        });
        
        Hooks.on("showAttack", async actor => {
            if (game.user.character == undefined)
                return;
                
            game.kamigakari.TimingDialog.attack.render(true);
        });
        
    }
    
    static validate(timing) {
		var items = game.user.character.items;
		var result = [];

		for (let item of items) {
			if (item.type == "talent") {
				var t = item.system.timing;
				if (t == timing)
					result.push(item)
			}
		}

		return result.length !== 0;
    }
    
    static setTimingDialogs() {
        let start = new Dialog({
            title: game.i18n.localize("KG.Timing") + ": " + game.i18n.localize("KG.Start"),
            content: `
                <h2>${game.i18n.localize("KG.ActionQuestion")}</h2>
            `,
            buttons: {
                action1: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action1"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Start") + ": " + game.i18n.localize("KG.Action1")};
                        ChatMessage.create(chatData);
                        
                        new TalentDialog(game.user.character, "Start").render(true);
                    }
                },
                action2: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action2"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Start") + ": " + game.i18n.localize("KG.Action2")};
                        ChatMessage.create(chatData);
                    }
                }
            }
        }, {top: 300, left: 20});
        
        
        let end = new Dialog({
            title: game.i18n.localize("KG.Timing") + ": " + game.i18n.localize("KG.End"),
            content: `
                <h2>${game.i18n.localize("KG.ActionQuestion")}</h2>
            `,
            buttons: {
                action1: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action1"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.End") + ": " + game.i18n.localize("KG.Action1")};
                        ChatMessage.create(chatData);
                        
                        new TalentDialog(game.user.character, "End").render(true);
                    }
                },
                action2: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action2"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.End") + ": " + game.i18n.localize("KG.Action2")};
                        ChatMessage.create(chatData);
                    }
                }
            }
        }, {top: 300, left: 20});
        
        let defense = new Dialog({
            title: game.i18n.localize("KG.Timing") + ": " + game.i18n.localize("KG.Defense"),
            content: `
                <h2>${game.i18n.localize("KG.ActionQuestion")}</h2>
            `,
            buttons: {
                action1: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action1"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Defense") + ": " + game.i18n.localize("KG.Action1")};
                        ChatMessage.create(chatData);
                        
                        new TalentDialog(game.user.character, "Defense", {top: 300, left: 20}).render(true);
                    }
                },
                action2: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action2"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Defense") + ": " + game.i18n.localize("KG.Action2")};
                        ChatMessage.create(chatData);
                    }
                }
            }
        }, {top: 300, left: 20});
        
        let prep = new Dialog({
            title: game.i18n.localize("KG.Timing") + ": " + game.i18n.localize("KG.Prep"),
            content: `
                <h2>${game.i18n.localize("KG.ActionQuestion")}</h2>
                <style>
                .battle .dialog-buttons {
                    flex-direction: column;
                }
                </style>
            `,
            buttons: {
                action1: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action1"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Prep") + ": " + game.i18n.localize("KG.Action1")};
                        ChatMessage.create(chatData);
                        
                        new TalentDialog(game.user.character, "Prep").render(true);
                        close = false;
                    }
                },
                action2: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action2"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Prep") + ": " + game.i18n.localize("KG.Action2")};
                        ChatMessage.create(chatData);
                        
                        close = true;
                    }
                },
                action3: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action3"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Prep") + ": " + game.i18n.localize("KG.Action3")};
                        ChatMessage.create(chatData);
                        
                        close = false;
                    }
                },
                action4: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action6"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Prep") + ": " + game.i18n.localize("KG.Action6")};
                        ChatMessage.create(chatData);
                        
                        game.user.character.sheet.render(true);
                        close = false;
                    }
                },
                action5: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action7"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Prep") + ": " + game.i18n.localize("KG.Action7")};
                        ChatMessage.create(chatData);
                        
                        game.user.character.sheet.render(true);
                        close = false;
                    }
                },
                action6: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action14"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Prep") + ": " + game.i18n.localize("KG.Action14")};
                        ChatMessage.create(chatData);
                        
                        close = true;
                    }
                }
            },
            close: () => {
                if (!close) {
                    new Dialog({
                        title: game.i18n.localize("KG.Timing") + ": " + game.i18n.localize("KG.Prep"),
                        content: `
                        <h2>${game.i18n.localize("KG.SpentTiming")}</h2>
                        `,
                        buttons: {
                            confirm: {
                                icon: '<i class="fas fa-check"></i>',
                                label: "Confirm",
                                callback: () => attack.render(true)
                            },
                            cancel: {
                                icon: '<i class="fas fa-times"></i>',
                                label: "Cancel",
                                callback: () => prep.render(true)
                            }
                        }
                    }, {top: 300, left: 20}).render(true);
                } else
                    attack.render(true);
                
            }
        }, {classes: ["kamigakari", "dialog", "battle"], top: 300, left: 20});
        
        let attack = new Dialog({
            title: game.i18n.localize("KG.Timing") + ": " + game.i18n.localize("KG.Attack"),
            content: `
                <h2>${game.i18n.localize("KG.ActionQuestion")}</h2>
                <style>
                .battle .dialog-buttons {
                    flex-direction: column;
                }
                </style>
            `,
            buttons: {
                action1: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action1"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action1")};
                        ChatMessage.create(chatData);
                        
                        new TalentDialog(game.user.character, "Attack").render(true);
                        close = false;
                    }
                },
                action2: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action2"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action2")};
                        ChatMessage.create(chatData);
                        
                        close = true;
                    }
                },
                action3: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action3"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action3")};
                        ChatMessage.create(chatData);
                        close = false;
                    }
                },
                action4: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action6"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action6")};
                        ChatMessage.create(chatData);
                        
                        game.user.character.sheet.render(true);
                        close = false;
                    }
                },
                action5: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action7"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action7")};
                        ChatMessage.create(chatData);
                        
                        game.user.character.sheet.render(true);
                        close = false;
                    }
                },
                action6: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action9"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action9")};
                        ChatMessage.create(chatData);
                        
                        game.user.character.sheet.render(true);
                        close = false;
                    }
                },
                action7: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action10"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action10")};
                        ChatMessage.create(chatData);
                        close = false;
                    }
                },
                action8: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action11"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action11")};
                        ChatMessage.create(chatData);

                        game.user.character.sheet.render(true);
                        close = false;
                    }
                },
                action9: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("KG.Action12"),
                    callback: () => {
                        let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action12")};
                        ChatMessage.create(chatData);
                                    
                        game.user.character.sheet.render(true);
                        close = false;
                    }
                }
            },
            close: () => {
                if (!close) {
                    new Dialog({
                        title: game.i18n.localize("KG.Timing") + ": " + game.i18n.localize("KG.Attack"),
                        content: `
                        <h2>${game.i18n.localize("KG.SpentTiming")}</h2>
                        `,
                        buttons: {
                            confirm: {
                                icon: '<i class="fas fa-check"></i>',
                                label: "Confirm"
                            },
                            cancel: {
                                icon: '<i class="fas fa-times"></i>',
                                label: "Cancel",
                                callback: () => attack.render(true)
                            }
                        }
                    }, {top: 300, left: 20}).render(true);
                }
                
            }
        }, {classes: ["kamigakari", "dialog", "battle"], top: 300, left: 20});
        
        
        return {start, end, prep, attack, defense}
    }
    
}
