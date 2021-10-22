export class TalentDialog extends Dialog {
    constructor(actor, timing, options) {
        super(options);

        this.actor = actor;
        this.timing = timing;
        this.talents = this._getTalents(actor, timing);

        this.data = {
            title: timing + ": " + game.i18n.localize("KG.UsageTalents"),
            content: this.getContent(),
            buttons: {}
        };

    }

      /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "templates/hud/dialog.html",
            classes: ["kamigakari", "dialog"],
            width: 600,
            height: 600
        });
    }

      /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.item-label').click(this._showItemDetails.bind(this));
        html.find(".echo-item").click(this._echoItemDescription.bind(this));
    }

    getContent() {
        var content = `<h2>[${(this.timing != "") ? game.i18n.localize("KG." + this.timing) : ""}]: ${ game.i18n.localize("KG.UsageTalents") }</h2>
                        <ol class="items-list">`;
                        
        for (let item of this.talents) {
            item = item.data;
            content += `
                        <li class="item flexrow" data-item-id="${item._id}" draggable="true">
                          <h4 class="item-name">
                            <span class="echo-item" style="float:left;">
                                <img src="${item.img}" title="${item.name}" width="37" height="37" style="vertical-align : middle;margin-right:10px;">
                            </span> 
                            <span class="item-label">[${item.data.condition}] ${item.name}<br>
                            <span style="color : gray; font-size : smaller;">
                            ${ game.i18n.localize("KG.Timing")} : ${(item.data.timing != "") ? game.i18n.localize("KG." + item.data.timing) : ""} / 
                            ${ game.i18n.localize("KG.Range")} : ${item.data.range} / 
                            ${ game.i18n.localize("KG.Target")} : ${item.data.target} / 
                            ${ game.i18n.localize("KG.Cost")} : ${item.data.cost}
                                <span class="item-details-toggle"><i class="fas fa-chevron-down"></i></span>
                         </span></span>
                          </h4>
                          <div class="item-description">${item.data.description}
                          </div>
                        </li>`;
        }
        content += '</ol>'

        return content;
    }

    _echoItemDescription(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents('.item');

        this.actor._echoItemDescription(li[0].dataset.itemId);
    }

    _showItemDetails(event) {
        event.preventDefault();
        const toggler = $(event.currentTarget);
        const item = toggler.parents('.item');
        const description = item.find('.item-description');

        toggler.toggleClass('open');
        description.slideToggle();
    }
    
    _getTalents(actor, timing) {
		var items = actor.items;
		var result = [];

		for (let item of items) {
			if (item.type == "talent") {
				var t = item.data.data.timing;
				if (t == timing)
					result.push(item)
			}
		}

		return result;
	}
}
