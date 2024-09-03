
import { DicesDialog } from "./dices-dialog.js";

export class ActorListDialog extends Dialog {
    constructor(options) {
        super(options);

        this.toggle = true;
        this.actors = this.getActors();

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
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "templates/hud/dialog.html",
            classes: ["kamigakari", "dialog"],
            width: 400
        });
    }

    /** @override */
	activateListeners(html) {
        super.activateListeners(html);
        
        html.find('#test').on('click', this.changeCharacter.bind(this, html));
    }

    getContent() {
        let viewName = (this.toggle) ? "Owner" : "Observer";
        let content = 
        `<h2 class="flexrow" style="padding-bottom: 2px; margin-bottom: 4px;">
            <span>Select Actors</span>
            <button style="flex: 0" id="test">${viewName}</button>
        </h2>`;
        content += '<select id="actor-select-dialog" multiple style="width: 100%; height: 480px">';

        for (let item of this.actors) {
            content += `<option value="${item._id}">${item.name}</option>`;
        }
        content += '</select></div>';

        return content;
    }

    async _submit() {
        var selected = $("#actor-select-dialog").val();
        var dialog = new DicesDialog(selected, {}).render(true);
    }

    getActors() {
        return (this.toggle) ? 
                game.actors.filter(e => e.type == "character" && 
                (e.ownership['default'] == 3 || e.ownership[game.user.id] == 3) ) :
                game.actors.filter(e => e.type == "character" && 
                (e.ownership['default'] >= 2 || e.ownership[game.user.id] >= 2) );
    }

    async changeCharacter(html) {
        this.toggle = !this.toggle;
        this.actors = this.getActors();

        this.data.content = this.getContent();
        this.render(true);
    }

}
