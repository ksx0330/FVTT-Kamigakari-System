
export class DicesDialog extends Dialog {
    constructor(selected, options) {
        super(options);

        this.selected = selected;
        this.data = {
            title: "Spirit Dice Viewer",
            content: "",
            buttons: {}
        };

    }

      /** @override */
	static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/kamigakari/templates/dice/dice-dialog.html",
            classes: ["kamigakari", "dialog"],
            width: 400
        });
    }

    /** @override */
    getData() {
        let buttons = Object.keys(this.data.buttons).reduce((obj, key) => {
          let b = this.data.buttons[key];
          if ( b.condition !== false ) obj[key] = b;
          return obj;
        }, {});

        let actors = [];
        for (let id of this.selected) {
            var actor = game.actors.get(id);
            var spiritDice = actor.data.data.attributes.spirit_dice.value;

            actors.push({id: id,name: actor.name, spiritDice: spiritDice});
        }

        return {
            content: this.data.content,
            buttons: buttons,
            actors: actors
        }
    }

    
      /** @override */
	activateListeners(html) {
        super.activateListeners(html);

        html.find('.spirit').on('mousedown', this._onRouteSpiritDice.bind(this, html));
    }


    async _onRouteSpiritDice(html, event) {
        var target = $(event.currentTarget);
        var actor = game.actors.get(target.parent()[0].dataset.id);

        var dice = target[0].dataset;
        var key = dice.key;
        var oriValue = dice.value;

        if (event.button == 2 || event.which == 3)
            await this._onUseSpirit(actor, key, oriValue);
        else
            await this._onChangeSpirit(actor, key, oriValue);
    }

    async _onUseSpirit(actor, key, oriValue) {
        event.preventDefault();

        const answer = confirm(actor.name + " - " + game.i18n.localize("KG.UseSpiritAlert") + "\n" + oriValue);
        if (answer) {
            var dices = JSON.parse(JSON.stringify(actor.data.data.attributes.spirit_dice.value));

            dices[key] = 0;
            await actor.update({"data.attributes.spirit_dice.value": dices});

            var context = game.i18n.localize("KG.UseSpiritMessage") ;
            ChatMessage.create({content: context + " " + oriValue, speaker: ChatMessage.getSpeaker({actor: actor})});
        }
    }

    async _onChangeSpirit(actor, key, oriValue) {
        event.preventDefault();

        const answer = prompt(actor.name + " - " + game.i18n.localize("KG.ChangeSpiritAlert"));
        if (!isNaN(answer) && answer != null && answer >= 1 && answer <= 6) {
            var dices = JSON.parse(JSON.stringify(actor.data.data.attributes.spirit_dice.value));

            dices[key] = answer;
            await actor.update({"data.attributes.spirit_dice.value": dices});

            var context = game.i18n.localize("KG.ChangeSpiritMessage") ;
            ChatMessage.create({content: context + "<br>" + oriValue + " -> " + answer, speaker: ChatMessage.getSpeaker({actor: actor})});
        }
    }

}
