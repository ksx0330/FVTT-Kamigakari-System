// Import Modules

import { DicesDialog } from "./dialog/dices-dialog.js";
import { KamigakariItemSheet } from "./sheet/item-sheet.js";
import { KamigakariActor } from "./actor/actor.js";
import { KamigakariActorSheet } from "./sheet/actor-sheet.js";
import { InfluenceDialog } from "./dialog/influence-dialog.js";
import { ActorListDialog } from "./dialog/actor-list-dialog.js";
import { KgRegisterHelpers } from "./handlebars.js";

import { createWorldbuildingMacro } from "./macro.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
	console.log('Initializing Kamigakri System.');
	
	game.kamigakari = {
		influence,
		setSpiritDice,
        showSpiritDiceViewer,
        SpiritDiceViewer: []
	  };

    Roll.TOOLTIP_TEMPLATE = "systems/kamigakari/templates/dice/tooltip.html";

    CONFIG.Actor.entityClass = KamigakariActor;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("kamigakari", KamigakariActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("kamigakari", KamigakariItemSheet, {makeDefault: true});

    // Patch Core Functions
    Combat.prototype._getInitiativeFormula = function(combatant) {
        const actor = combatant.actor;
        const init = actor.data.data.attributes.init.value;

        return "" + init;
    };

    KgRegisterHelpers.init();

    // Register system settings
    game.settings.register("kamigakari", "talentClassify", {
        name: "SETTINGS.TalentClassify",
        hint: "SETTINGS.TalentClassifyDesc",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("kamigakari", "rollAddon", {
        name: "SETTINGS.RollAddon",
        hint: "SETTINGS.RollAddonDesc",
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

});

Hooks.on('createActor', async (actor, options, id) => {

	if (actor.data.data.details.basic == "") {
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
    console.log(data);
    console.log(delta);
    for (let turn of data.turns) {
        for (let item of turn.actor.activeTalent) {
            console.log(item);
            if (item.data.data.disable == 'battle')
                await item.update({"data.active": false});
        }
    }
  
});

Hooks.on("updateCombat", async function (data, delta) {

    if (Object.keys(delta).some((k) => k === "round")) {
        for (let turn of data.turns) {
            for (let item of turn.actor.activeTalent)
                if (item.data.data.disable == 'round')
                    await item.update({"data.active": false});
        }
    }
});

Hooks.on("hotbarDrop", (bar, data, slot) => createWorldbuildingMacro(data, slot));

Hooks.on("renderChatLog", (app, html, data) => chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => chatListeners(html));

async function chatListeners(html) {
    html.on('click', '.use-item', async ev => {
      event.preventDefault();
      const data = ev.currentTarget.dataset;
      const actor = game.actors.get(data.actorId);
      const item = actor.getOwnedItem(data.itemId);
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
            const item = actor.getOwnedItem(data.itemId);
            const macro = game.macros.entities.find(m => (m.data.name === item.data.data.macro));

            await item.update({"data.active": true});
            if (item.data.data.roll == 'acc')
              actor._rollDice('acc', game.i18n.localize("KG.AbilityACC"));
            else if (item.data.data.roll == 'cnj')
              actor._rollDice('cnj', game.i18n.localize("KG.AbilityCNJ"));

            ChatMessage.create({"content": game.i18n.localize("KG.UseTalent") + ": " + item.data.name});

            if (macro != undefined)
                macro.execute();
            else if (item.data.data.macro != "")
                alert("Do not find this macro: " + item.data.data.macro);
          }

        }
      }

      var dialog = new DicesDialog([data.actorId], buttons).render(true);


    });

    html.on('click', '.calc-damage', async ev => {
      event.preventDefault();
      const data = ev.currentTarget.dataset;
      const actor = game.actors.get(data.actorId);
      actor._rollDamage();
    });

    html.on('click', '.apply-damage', async ev => {
      event.preventDefault();
      const data = ev.currentTarget.dataset;
      const targets = game.users.get(game.user.id).targets;

      new Dialog({
          title: game.i18n.localize("KG.ApplyDamage"),
          content: `<p>
                      <h2 style="text-align: center;">${data.damage}</h2>

                      <table>
                        <tr>
                          <th>${game.i18n.localize("KG.Weakness")}</th>
                          <td><input type="checkbox" id="weak"></td>

                          <th>${game.i18n.localize("KG.Half")}</th>
                          <td><input type="checkbox" id="half"></td>

                          <th>${game.i18n.localize("KG.AddDamage")}</th>
                          <td><input type="text" id="add" style="margin-left: 5px; width: 90%;"></td>
                        </tr>

                      </table>

                    </p>`,
          buttons: {
            confirm: {
              icon: '<i class="fas fa-check"></i>',
              label: "Confirm",
              callback: async () => {
                let damage = Number(data.damage) + Number($("#add").val());
                if (data.rank < 10 && $("#weak").is(":checked"))
                  damage += Number(data.high);
                if ($("#half").is(":checked"))
                  damage = Math.ceil(damage / 2.0);

                for (var target of targets) {
                  let actor = target.actor;
                  let actorData = actor.data.data;

                  let armor = actorData.attributes.armor.value + actorData.attributes.defense.armor;
                  let barrier = actorData.attributes.barrier.value + actorData.attributes.defense.barrier;

                  let reduce = actorData.attributes.defense.reduce;
                  let half = actorData.attributes.defense.half;

                  if (data.armorIgnore == "true")
                    armor = 0;
                  else
                    armor = (armor - data.armorReduce < 0) ? 0 : armor - data.armorReduce;

                  if (data.barrierIgnore == "true")
                    barrier = 0;
                  else
                    barrier = (barrier - data.barrierReduce < 0) ? 0 : barrier - data.barrierReduce;

                  var realDamage = damage;
                  if (data.type == "acc")
                    realDamage -= armor;
                  else if (data.type == "cnj")
                    realDamage -= barrier

                  realDamage -= reduce;
                  realDamage = (half) ? Math.ceil(realDamage / 2.0) : realDamage;
                  realDamage = (realDamage < 0) ? 0 : realDamage;

                  await actor.update({"data.attributes.hp.value": actorData.attributes.hp.value - realDamage});
                  let chatData = {"content": actor.name + " (-" + realDamage + ")", "speaker": ChatMessage.getSpeaker({ actor: actor })};
                  ChatMessage.create(chatData);
                }


              }
            }
          },
          default: "confirm"
      }).render(true);    



    });

}

async function setSpiritDice() {
	const speaker = ChatMessage.getSpeaker();
	let actor;
	if (speaker.token) actor = game.actors.tokens[speaker.token];
	if (!actor) actor = game.actors.get(speaker.actor);

	if (actor == null) {
		alert("You must use actor");
		return;
	}

	var answer = prompt("Whay do you want to change?\n ex) 4, 5");
	if (!isNaN(answer) && answer != null && answer >= 1) {
        var dices = new Array(Number(answer)).fill(0);
		await actor.update({'data.attributes.spirit_dice.value': dices });
	}

}

function influence() {
	const speaker = ChatMessage.getSpeaker();
	let actor = game.actors.get(speaker.actor);

	if (actor == null) {
		alert("You must use actor");
		return;
	}

	var m = game.messages["entities"].filter(element => element.data.speaker.alias == actor.data.name && element.data.content.indexOf("<span class=\"dice-rolls\">") != -1);

	if (m.length == 0) {
		alert("Unusual Approach.");
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
