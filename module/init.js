// Import Modules

import { DicesDialog } from "./dialog/dices-dialog.js";
import { KamigakariItemSheet } from "./sheet/item-sheet.js";
import { KamigakariActor } from "./actor/actor.js";
import { KamigakariActorSheet } from "./sheet/actor-sheet.js";
import { InfluenceDialog } from "./dialog/influence-dialog.js";
import { ActorListDialog } from "./dialog/actor-list-dialog.js";
import { TalentDialog } from "./dialog/talent-dialog.js";
import { KgRegisterHelpers } from "./handlebars.js";
import { KgRegisterSettings } from "./settings.js";
import { KamigakariCombat } from "./combat.js";
import { DamageController } from "./damage.js";

import { createWorldbuildingMacro } from "./macro.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log('Initializing Kamigakri System.');
    
    game.kamigakari = {
        influence,
        setSpiritDice,
        TalentDialog,
        DicesDialog,
        showSpiritDiceViewer,
        SpiritDiceViewer: [],
    };

    Roll.TOOLTIP_TEMPLATE = "systems/kamigakari/templates/dice/tooltip.html";

    CONFIG.Actor.documentClass = KamigakariActor;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("kamigakari", KamigakariActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("kamigakari", KamigakariItemSheet, {makeDefault: true});

    CONFIG.Combat.documentClass = KamigakariCombat;
    CONFIG.Combat.initiative.formula = "@attributes.init.value"

    KgRegisterHelpers.init();
    KgRegisterSettings.init();
    DamageController.init(); 

});

Hooks.on('createActor', async (actor, options, id) => {

    if (actor.isOwner && actor.data.data.details.basic == "") {
        await actor.update({'data.details.basic': game.i18n.localize("KG.EnermyDefault") })
    }
});

Hooks.on("canvasInit", function() {
    SquareGrid.prototype.measureDistances = function(segments) {
        // Track the total number of diagonals
        let nDiagonal = 0;
        const rule = this.parent.diagonalRule;
        const d = canvas.dimensions;
      
        // Iterate over measured segments
        return segments.map(s => {
            let r = s.ray;

            // Determine the total distance traveled
            let nx = Math.abs(Math.ceil(r.dx / d.size));
            let ny = Math.abs(Math.ceil(r.dy / d.size));

            // Determine the number of straight and diagonal moves
            let nd = Math.min(nx, ny);
            let ns = Math.abs(ny - nx);
            nDiagonal += nd;
        
            let spaces = nd * 2 + ns;
            return spaces * canvas.dimensions.distance;
        });
    };
});


Hooks.on("updateActor", function() {
    game.kamigakari.SpiritDiceViewer = game.kamigakari.SpiritDiceViewer.filter(e => e._state != -1);
    var viewers = game.kamigakari.SpiritDiceViewer;

    if (viewers.length != 0) {
        for (let viewer of viewers)
            viewer.render(true);
    }


});

Hooks.on("getSceneControlButtons", function(controls) {
    controls[0].tools.push({
        name: "diceviewer",
        title: "Spirit Dice Viewer",
        icon: "fas fa-yin-yang",
        visible: true,
        onClick: () => game.kamigakari.showSpiritDiceViewer(),
        button: true
    });

});

Hooks.on("deleteCombat", async function (data, delta) {
    for (let turn of data.turns) {
    if (turn.actor.type == "enemy")
        continue;
    
        for (let item of turn.actor.items) {
            let updates = {};
            if (item.data.data.active != undefined)
            if (item.data.data.active.disable == 'damage' || item.data.data.active.disable == 'round' || item.data.data.active.disable == 'battle')
                updates["data.active.state"] = false;
            
            if (item.data.data.used != undefined)
            if (item.data.data.used.disable == 'round' || item.data.data.used.disable == 'battle')
                updates["data.used.state"] = 0;
            
            await item.update(updates);
        }
    }
  
});

Hooks.on("updateCombat", async function (data, delta) {
    var close = true;
    if (delta.round == 0 || delta.active == true)
    return;

    if (Object.keys(delta).some((k) => k === "round") && game.settings.get("kamigakari", "autoSpiritDiceCharge")) {
        for (let turn of data.turns) {
            if (turn.actor.type == "enemy")
            continue;
            
            for (let item of turn.actor.items) {
                let updates = {};
                if (item.data.data.active != undefined)
                if (item.data.data.active.disable == 'damage' || item.data.data.active.disable == 'round')
                    updates["data.active.state"] = false;
                
                if (item.data.data.used != undefined)
                if (item.data.data.used.disable == 'round')
                    updates["data.used.state"] = 0;
                
                await item.update(updates);
            }
                
            if (delta.round != 1) {
                var dices = JSON.parse(JSON.stringify(turn.actor.data.data.attributes.spirit_dice.value));
                for (var i = 0; i < dices.length; ++i) {
                    if (dices[i] != 0)
                    continue;
                    dices[i] = Math.floor(Math.random() * 6) + 1;
                }

                await turn.actor.update({"data.attributes.spirit_dice.value": dices, "data.attributes.overflow.value": 0});
            }
        }
    }
    

    if (game.user.character === undefined || game.user.character.type === "enemy")
        return;
    
    var start = new Dialog({
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
    
    var end = new Dialog({
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
    
    var prep = new Dialog({
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
                    
                    combatant.actor.sheet.render(true);
                    close = false;
                }
            },
            action5: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("KG.Action7"),
                callback: () => {
                    let chatData = {"content": game.i18n.localize("KG.Prep") + ": " + game.i18n.localize("KG.Action7")};
                    ChatMessage.create(chatData);
                    
                    combatant.actor.sheet.render(true);
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
    
    var attack = new Dialog({
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
                    
                    combatant.actor.sheet.render(true);
                    close = false;
                }
            },
            action5: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("KG.Action7"),
                callback: () => {
                    let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action7")};
                    ChatMessage.create(chatData);
                    
                    combatant.actor.sheet.render(true);
                    close = false;
                }
            },
            action6: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("KG.Action9"),
                callback: () => {
                    let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action9")};
                    ChatMessage.create(chatData);
                    
                    combatant.actor.sheet.render(true);
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
                                
                    combatant.actor.sheet.render(true);
                    close = false;
                }
            },
            action9: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("KG.Action12"),
                callback: () => {
                    let chatData = {"content": game.i18n.localize("KG.Attack") + ": " + game.i18n.localize("KG.Action12")};
                    ChatMessage.create(chatData);
                                
                    combatant.actor.sheet.render(true);
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
    
    var combatant = data.turns[(delta.turn == undefined) ? 0 : delta.turn];
    if (combatant.data.name == "[" +  game.i18n.localize("KG.Start") + "]" && game.settings.get("kamigakari", "startTimingDialog"))
        start.render(true);
    else if (combatant.data.name == "[" +  game.i18n.localize("KG.End") + "]" && game.settings.get("kamigakari", "endTimingDialog"))
        end.render(true);
    else if (game.user.character.id == combatant.actor.id && game.settings.get("kamigakari", "mainTimingDialog"))
        prep.render(true);
    
});

Hooks.on("hotbarDrop", (bar, data, slot) => createWorldbuildingMacro(data, slot));

Hooks.on("renderChatLog", (app, html, data) => chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => chatListeners(html));

async function chatListeners(html) {
    html.on('click', '.use-item', async ev => {
        event.preventDefault();
        const data = ev.currentTarget.dataset;
        const actor = game.actors.get(data.actorId);
        const item = actor.items.get(data.itemId);
        actor._useItem(item);
    });

    html.on('click', '.use-talent', async ev => {
        event.preventDefault();
        const data = ev.currentTarget.dataset;

        const buttons = {
            "cancel": {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            },
            "use": {
                icon: '<i class="fas fa-check"></i>',
                label: "Use",
                callback: async () => {
                    const actor = game.actors.get(data.actorId);
                    const item = actor.items.get(data.itemId);
                    const macro = game.macros.contents.find(m => (m.data.name === item.data.data.macro));
                    
                    let confirm = async () => {
                        let updates = {};
                        if (item.data.data.active.disable != 'notCheck')
                            updates["data.active.state"] = true;
                        if (item.data.data.used.disable != 'notCheck')
                            updates["data.used.state"] = item.data.data.used.state + 1;
                        await item.update(updates);
                        
                        if (item.data.data.roll == 'acc')
                            actor._rollDice('acc');
                        else if (item.data.data.roll == 'cnj')
                            actor._rollDice('cnj');

                        ChatMessage.create({"content": game.i18n.localize("KG.UseTalent") + ": " + item.data.name});

                        if (macro != undefined)
                            macro.execute();
                        else if (item.data.data.macro != "")
                            new Dialog({
                                title: "macro",
                                content: `Do not find this macro: ${item.data.data.macro}`,
                                buttons: {}
                            }).render(true);
                    }
        
                    if (!item.data.data.getTarget)
                        confirm();
                    else {
                        new Dialog({
                            title: 'Select Targets',
                            content: `
                              <h2>${game.i18n.localize("KG.SelectTarget")}</h2>
                            `,
                            buttons: {
                                confirm: {
                                    icon: '<i class="fas fa-check"></i>',
                                    label: "Confirm",
                                    callback: confirm
                                }
                            },
                            default: "confirm"
                        }, {top: 300, left: 20}).render(true);
                    }
                }

            }
        }

        var dialog = new DicesDialog([data.actorId], buttons).render(true);
    });

    html.on('click', '.calc-damage', async ev => {
        event.preventDefault();
        const data = ev.currentTarget.dataset;
        const actor = game.actors.get(data.actorId);

        DamageController.calcDamage(actor, data.roll, data.formula);
    });

    html.on('click', '.apply-damage', async ev => {
        event.preventDefault();
        const data = ev.currentTarget.dataset;
 
        DamageController.finalDamageDialog(data);
    });

}

async function setSpiritDice() {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);

    if (actor == null) {
        new Dialog({
            title: "alert",
            content: `You must use actor`,
            buttons: {}
        }).render(true);
        return;
    }

    new Dialog({
        title: 'Spirit Dice',
        content: `
            <h2>Whay do you want to change?\n ex) 4, 5</h2>
            <div style="margin: 4px 0;"><input type="number" id="dice-num"></div>
            <script>$("#dice-num").focus()</script>
        `,
        buttons: {
            confirm: {
                icon: '<i class="fas fa-check"></i>',
                label: "Confirm",
                callback: async () => {
                    var answer = $("#dice-num").val();

                    if (!isNaN(answer) && answer != null && answer >= 1) {
                        var dices = new Array(Number(answer)).fill(0);
                        await actor.update({'data.attributes.spirit_dice.value': dices });
                    }
                } 
            }   
        },
        default: "confirm"
    }).render(true);

}

function influence() {
    const speaker = ChatMessage.getSpeaker();
    let actor = game.actors.get(speaker.actor);

    if (actor == null) {
        new Dialog({
            title: "alert",
            content: `You must use actor`,
            buttons: {}
        }).render(true);
        return;
    }

    var m = game.messages["entities"].filter(element => element.data.speaker.alias == actor.data.name && element.data.content.indexOf("<span class=\"dice-rolls\">") != -1);

    if (m.length == 0) {
        new Dialog({
            title: "alert",
            content: `Unusual Approach`,
            buttons: {}
        }).render(true);
        return;
    }
    var d = $(m[m.length - 1].data.content);
    var modScore = d.find(".dice-total").text() - d.find(".part-total").text();

    var actionDice = [];
    var spiritDice = actor.data.data.attributes.spirit_dice.value;

    var dices = d.find("img");
    dices.each(function() {
        actionDice.push($(this).attr("data-dice"));
    });

    let dialog = new InfluenceDialog(actionDice, spiritDice, actor, modScore);
    dialog.render(true);
}

function showSpiritDiceViewer() {
    var actors = game.data.actors.filter(element => element.type == "character" && (element.permission['default'] == 3 ) );

    let dialog = new ActorListDialog(actors)
    dialog.render(true);
}

