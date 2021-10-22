import { DamageController } from "../combat/damage.js";

export class DefenseDialog extends Dialog {
    constructor(actor, data, options) {
        super(options);
        
        this.actor = actor;
        this.damage = (data.recovery) ? "+" + data.realDamage : "-" + data.realDamage;

        this.data = {
            title: game.i18n.localize("KG.DamageReduce"),
            content: "",
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => {
                        let defense = {};
                        defense.armor = ($("#armor").val() == "") ? 0 : +$("#armor").val();
                        defense.barrier = ($("#barrier").val() == "") ? 0 : +$("#barrier").val();
                        defense.reduce = ($("#reduce").val() == "") ? 0 : +$("#reduce").val();
                        defense.half = $("#half").is(":checked");
                        defense.quarter = $("#quarter").is(":checked");
                        
                        DamageController.applyDamage(actor, data.data, defense, data.realDamage, data.recovery);
                        
                    }
                }
            },
            default: "confirm"
        };

        game.kamigakari.DamageDialog.push(this);
    }
    
      /** @override */
	static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/kamigakari/templates/battle/defense-dialog.html",
            classes: ["kamigakari", "dialog"],
            width: 400
        });
    }
    
    /** @override */
    getData() {
        
        return {
            name: this.actor.name,
            damage: this.damage,
            armor: this.actor.data.data.attributes.reduce.armor,
            barrier: this.actor.data.data.attributes.reduce.barrier,
            reduce: this.actor.data.data.attributes.reduce.damage,
            half: (this.actor.data.data.attributes.reduce.half) ? "checked": "",
            quarter: (this.actor.data.data.attributes.reduce.quarter) ? "checked" : "",
            buttons: this.data.buttons
        }
    }

}
