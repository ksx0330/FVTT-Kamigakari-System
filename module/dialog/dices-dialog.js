
export class DicesDialog extends Dialog {
    constructor(selected, buttons, options) {
        super(options);

        this.selected = selected;
        this.data = {
            title: "Spirit Dice Viewer",
            content: "",
            buttons: buttons
        };

        game.kamigakari.SpiritDiceViewer.push(this);
    }

      /** @override */
	static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
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
            var spiritDice = actor.system.attributes.spirit_dice.value;

            actors.push({id: id,name: actor.name, spiritDice: spiritDice, overflow: actor.system.attributes.overflow.value});
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

        html.find('.add--overflow').on('click', async ev => {
          const add = Number(ev.currentTarget.dataset.add);
          let target = $(event.currentTarget);
          let actor = game.actors.get(target.parent()[0].dataset.id);

          if (!actor.isOwner) {
            new Dialog({
              title: "alert",
              content: `Not permission`,
              buttons: {}
            }).render(true);
            return;
          }

          const overflow = actor.system.attributes.overflow.value;

          if (overflow + add < 0)
            return;

          await actor.update({"system.attributes.overflow.value": overflow + add});
          let chatData = {"content": "Overflow : " + overflow + "->" + (overflow + add) };
          ChatMessage.create(chatData);
        });

    }


    async _onRouteSpiritDice(html, event) {
        let target = $(event.currentTarget);
        let actor = game.actors.get(target.parent()[0].dataset.id);

        if (!actor.isOwner) {
          new Dialog({
            title: "alert",
            content: `Not permission`,
            buttons: {}
          }).render(true);
          return;
        }

        let dice = target[0].dataset;
        let key = dice.key;
        let oriValue = dice.value;

        if (event.button == 2 || event.which == 3)
            await this._onUseSpirit(actor, key, oriValue);
        else
            await this._onChangeSpirit(actor, key, oriValue);
    }

    async _onUseSpirit(actor, key, oriValue) {
        event.preventDefault();

        new Dialog({
            title: 'Use Spirit Dice',
            content: `
              <h2>${actor.name} - ${game.i18n.localize("KG.UseSpiritAlert")}</h2>
              <h3 style="text-align: center">${oriValue}</h3>
            `,
            buttons: {
              confirm: {
                icon: '<i class="fas fa-check"></i>',
                label: "Confirm",
                callback: async () => {
                  var dices = JSON.parse(JSON.stringify(actor.system.attributes.spirit_dice.value));

                  dices[key] = 0;
                  await actor.update({"system.attributes.spirit_dice.value": dices});

                  var context = game.i18n.localize("KG.UseSpiritMessage") ;
                  ChatMessage.create({content: context + " " + oriValue, speaker: ChatMessage.getSpeaker({actor: actor})});
                }
              }
            },
            default: "confirm"
        }).render(true);

    }

    async _onChangeSpirit(actor, index, oriValue) {
      event.preventDefault();
      game.changeDialog = new Dialog({
        title: game.i18n.localize("Juink.ChangeFateDice"),
        content: `
            <h2 style="font-weight: bold; text-align: center;">${game.i18n.localize("KG.ChangeSpiritAlert")}</h2>
            <div style="display: flex; gap: 6px; justify-content: center;">
                <img onclick="onChange(1)" src="systems/kamigakari/assets/dice/1.PNG" width=50 height=50>
                <img onclick="onChange(2)" src="systems/kamigakari/assets/dice/2.PNG" width=50 height=50>
                <img onclick="onChange(3)" src="systems/kamigakari/assets/dice/3.PNG" width=50 height=50>
                <img onclick="onChange(4)" src="systems/kamigakari/assets/dice/4.PNG" width=50 height=50>
                <img onclick="onChange(5)" src="systems/kamigakari/assets/dice/5.PNG" width=50 height=50>
                <img onclick="onChange(6)" src="systems/kamigakari/assets/dice/6.PNG" width=50 height=50>
            </div>
            <script>
            async function onChange(answer) {
                let document = game.actors.get("${actor.id}");
                let dices = duplicate(document.system.attributes.spirit_dice.value);
                dices[${index}] = answer;
                await document.update({"system.attributes.spirit_dice.value": dices});
  
                let context = game.i18n.localize("KG.ChangeSpiritMessage") ;
                ChatMessage.create({content: context + ": " + ${oriValue} + " -> " + answer, speaker: ChatMessage.getSpeaker({actor: document})});
                game.changeDialog.close();
            }
            </script>
        `,
        buttons: {}
      }, {width: "150px"}).render(true);

    }

}
