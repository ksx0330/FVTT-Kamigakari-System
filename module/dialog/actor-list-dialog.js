
import { DicesDialog } from "./dices-dialog.js";

export class ActorListDialog extends Dialog {
    constructor(actors, options) {
        super(options);

        this.actors = actors;

        this.data = {
            title: "Select Actors",
            content: this.getContent(),
            buttons: {
                "cancel": {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => console.log("Canceled")
                },
                "select": {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Select",
                    callback: () => this._submit()
                }
            },
            default: "select"
        };

    }

      /** @override */
	static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "templates/hud/dialog.html",
            classes: ["kamigakari", "dialog"],
            width: 400
        });
    }

    getContent() {
        var content = "<p>Select actors<br><div>";
        content += '<select id="actor-select-dialog" multiple style="width: 100%; height: 100%">';

        for (let item of this.actors) {
            content += `<option value="${item._id}">${item.name}</option>`;
        }
        content += '</select></div>';

        return content;
    }

    async _submit() {
        var selected = $("#actor-select-dialog").val();

        game.kamigakari.SpiritDiceViewer = new DicesDialog(selected);
        game.kamigakari.SpiritDiceViewer.render(true);
    }

}
