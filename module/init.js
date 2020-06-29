// Import Modules

import { KamigakariItemSheet } from "./item-sheet.js";
import { KamigakariActorSheet } from "./actor-sheet.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
	console.log('Initializing Kamigakri System.');
	
	game.kamigakari = {
		influence
	  };

    CONFIG.Dice.tooltip = "systems/kamigakari/templates/dice/tooltip.html";

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("kamigakari", KamigakariActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("kamigakari", KamigakariItemSheet, {makeDefault: true});



});

Hooks.on('createActor', async (actor, options, id) => {
    await actor.update({ 'data.details.look': game.i18n.localize("KG.LookDefault"), 'data.details.spirit_look': game.i18n.localize("KG.SpiritLookDefault")  });
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


function influence() {
	const speaker = ChatMessage.getSpeaker();
	let actor;
	if (speaker.token) actor = game.actors.tokens[speaker.token];
	if (!actor) actor = game.actors.get(speaker.actor);

	if (actor == null)
		alert("You must use actor");

	var m = $(".message-sender:contains('" + actor.data.name + "')");
	var d = m.parent().parent().find(".dice-rolls").last();
	var modScore = d.parent().parent().find(".dice-total").text() - d.parent().parent().find(".part-total").text();

	var actionDice = [];
	var spiritDice = actor.data.data.attributes.spirit_dice.value;
	
	var dices = d.find("img");
	dices.each(function() {
		actionDice.push($(this).attr("data-dice"));
	});
	
	var content = "<p>What do you change dice?<br><br>Action Dice<br>";
	$(actionDice).each(element => {
		content += '<img width=30 height=30 src="systems/kamigakari/assets/dice/' + actionDice[element] + '.PNG">';
	});
	content += "<br>Spirit Dice<br>";
	for (let [key, value] of Object.entries(spiritDice)) {
		content += '<img width=30 height=30 src="systems/kamigakari/assets/dice/' + value + '.PNG">';
	}
	content += "<br></p><div style='display: flex; text-align: center'>";
	content += "<input type='text' placeholder='action' name='action'>";
	content += "<span> - </span>";
	content += "<input type='text' placeholder='spirit' name='spirit'></div><br>";
	
	let dialog1 = new Dialog({
	 title: "Influence",
	 content: content,
	 buttons: {
		"cancel": {
			icon: '<i class="fas fa-times"></i>',
			label: "cancel",
			callback: () => console.log("Canceled")
		},
		"change": {
			icon: '<i class="fas fa-check"></i>',
			label: "Change",
			callback: () => {
				var action = $("input[name=action]").val();
				var spirit = $("input[name=spirit]").val();
	
				if (action >= 1 && action <= 6 && spirit >= 1 && spirit <= 6) {
					var actionIndex = actionDice.findIndex(element => element == action);
					var spiritIndex = Object.keys(spiritDice).find(key => spiritDice[key] == spirit);
	
					if (actionIndex == -1 || spiritIndex == undefined) {
						alert("Not validated input");
						return;
					}
	
					var tmp = actionDice[actionIndex];
					actionDice[actionIndex] = spiritDice[spiritIndex];
					actor.update({[`data.attributes.spirit_dice.value.${spiritIndex}`]: tmp});
	
					var formula = "";
					$(actionDice).each(element => {
						formula += actionDice[element] + "+";
					});
					formula += modScore;
	
					var roll = new Roll(formula);
					roll.roll();
					roll.render().then(r => {
						ChatMessage.create({content: r, speaker: ChatMessage.getSpeaker({actor: actor})});
					});
	
				}
	
			}
		}
	 },
	 default: "cancel",
	 close: () => console.log("This always is logged no matter which option is chosen")
	});
	
	dialog1.render(true);



}