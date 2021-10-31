// Import Modules

import { DicesDialog } from "./dialog/dices-dialog.js";
import { KamigakariItemSheet } from "./sheet/item-sheet.js";
import { KamigakariActor } from "./actor/actor.js";
import { KamigakariActorSheet } from "./sheet/actor-sheet.js";
import { InfluenceDialog } from "./dialog/influence-dialog.js";
import { ActorListDialog } from "./dialog/actor-list-dialog.js";
import { TalentDialog } from "./dialog/talent-dialog.js";
import { KamigakariCombat } from "./combat/combat.js";
import { DamageController } from "./combat/damage.js";
import { KgRegisterHelpers } from "./handlebars.js";
import { KgRegisterSettings } from "./settings.js";
import { SocketController } from "./socket.js";
import { DisableHooks } from "./disable-hooks.js";
import { TimingHooks } from "./timing-hooks.js";

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
        DamageDialog: []
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
    SocketController.init();
    DamageController.init();


});

Hooks.once("ready", async function() {
    TimingHooks.init();
    DisableHooks.init();    
    
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
    let reload = (dialogs) => {
        let d = dialogs.filter(e => e._state != -1);
        if (d.length != 0) {
            for (let dialog of d)
                dialog.render(true);
        }
        
        return d
    }
    
    game.kamigakari.SpiritDiceViewer = reload(game.kamigakari.SpiritDiceViewer);
    game.kamigakari.DamageDialog = reload(game.kamigakari.DamageDialog);
});

Hooks.on("updateItem", () => Hooks.call("updateActor"));

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
    let actors = data.turns.reduce( (acc, i) => {
        if (i.actor.type == "enemy")
            return acc;
        
        acc.push(i.actor);
        return acc; 
    }, []);
    
    Hooks.call("afterCombat", actors);
  
});

Hooks.on("updateCombat", async function (data, delta) {
    var close = true;
    if (data.round == 0 || data.active == true)
    return;

    if (Object.keys(delta).some((k) => k === "round") && game.settings.get("kamigakari", "autoSpiritDiceCharge")) {
        let actors = data.turns.reduce( (acc, i) => {
            if (i.actor.type == "enemy")
                return acc;
            
            acc.push(i.actor);
            return acc; 
        }, []);
        
        Hooks.call("afterRound", actors);
        
        if (data.round > 1) {
            for (let actor of actors) {
                var dices = JSON.parse(JSON.stringify(actor.data.data.attributes.spirit_dice.value));
                for (var i = 0; i < dices.length; ++i) {
                    if (dices[i] != 0)
                    continue;
                    dices[i] = Math.floor(Math.random() * 6) + 1;
                }

                await actor.update({"data.attributes.spirit_dice.value": dices, "data.attributes.overflow.value": 0});
            }
        }
    }
    

    if (game.user.character === undefined || game.user.character.type === "enemy")
        return;
    
    var combatant = data.turns[(delta.turn == undefined) ? 0 : delta.turn];
    if (combatant.data.name == "[" +  game.i18n.localize("KG.Start") + "]")
        Hooks.call("showStart");
    else if (combatant.data.name == "[" +  game.i18n.localize("KG.End") + "]")
        Hooks.call("showEnd");
    else if (game.user.character.id == combatant.actor.id && game.settings.get("kamigakari", "mainTimingDialog"))
        Hooks.call("showPrep");
    
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
        const ctrlClick = event.ctrlKey;

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
                            actor._rollDice('acc', ctrlClick);
                        else if (item.data.data.roll == 'cnj')
                            actor._rollDice('cnj', ctrlClick);

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
                                    callback: async () => {
                                        if (item.data.data.effect.disable != "-") {
                                            let targets = game.user.targets;
                                            for (let t of targets) {
                                                let a = t.actor;
                                                if (a.data.type === "enemy")
                                                    continue;

                                                let effects = {};
                                                effects[item.id] = {
                                                    actorId: actor.id,
                                                    itemId: item.id,
                                                    disable: item.data.data.effect.disable,
                                                    attributes: item.data.data.effect.attributes
                                                }
                                                
                                               await a.update({"data.attributes.effects": effects});
                                            }
                                        }
                                        confirm();
                                    }
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

        DamageController.calcAttackDamage(actor, data.roll, data.formula);
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
    var actors = game.data.actors.filter(e => e.type == "character" && (e.permission['default'] == 3 || e.permission[game.user.id] == 3) );

    let dialog = new ActorListDialog(actors)
    dialog.render(true);
}

