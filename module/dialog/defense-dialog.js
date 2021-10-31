import { DamageController } from "../combat/damage.js";

export class DefenseDialog extends Dialog {
    constructor(actor, data, options) {
        super(options);
        
        this.actor = actor;
        this.damageData = data;

        this.data = {
            title: game.i18n.localize("KG.DamageReduce"),
            content: "",
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => {
                        let defense = this.getDefense();
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
	activateListeners(html) {
        super.activateListeners(html);
        
        html.find('input').on('change', this.calcLife.bind(this, html));
        
    }
    
    /** @override */
    getData() {
        let defense = {
            armor: this.actor.data.data.attributes.reduce.armor,
            barrier: this.actor.data.data.attributes.reduce.barrier,
            reduce: this.actor.data.data.attributes.reduce.damage,
            half: this.actor.data.data.attributes.reduce.half,
            quarter: this.actor.data.data.attributes.reduce.quarter
        }
        
        let {life, realDamage} = DamageController.calcDefenseDamage(this.actor, this.damageData.data, defense, this.damageData.realDamage, this.damageData.recovery);
        
        return {
            name: this.actor.name,
            src: this.actor.img,
            recovery: this.damageData.recovery,
            life: life,
            realDamage: realDamage,
            damage: (this.damageData.recovery) ? "+" + this.damageData.realDamage : "-" + this.damageData.realDamage,
            armor: this.actor.data.data.attributes.reduce.armor,
            barrier: this.actor.data.data.attributes.reduce.barrier,
            reduce: this.actor.data.data.attributes.reduce.damage,
            half: (this.actor.data.data.attributes.reduce.half) ? "checked": "",
            quarter: (this.actor.data.data.attributes.reduce.quarter) ? "checked" : "",
            buttons: this.data.buttons
        }
    }
    
    getDefense() {
        let defense = {};
        defense.armor = ($("#armor").val() == "") ? 0 : +$("#armor").val();
        defense.barrier = ($("#barrier").val() == "") ? 0 : +$("#barrier").val();
        defense.reduce = ($("#reduce").val() == "") ? 0 : +$("#reduce").val();
        defense.half = $("#half").is(":checked");
        defense.quarter = $("#quarter").is(":checked");
        
        return defense;
    }
    
    calcLife(html) {
        let defense = this.getDefense();
        let {life, realDamage} = DamageController.calcDefenseDamage(this.actor, this.damageData.data, defense, this.damageData.realDamage, this.damageData.recovery);
        
        $("#realDamage").text(realDamage);
        $("#life").text(life);
    }

}
