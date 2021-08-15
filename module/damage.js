export class DamageController {
    static async calcDamage(actor, roll, formula) {
        if (actor.type === "character") {
            let actorData = actor.data.data;
            let formula = actorData.attributes.damage.high + " X " + actorData.attributes.damage.rank + " + " + actorData.attributes.damage.add;
            let roll = actorData.attributes.damage.roll;
            
            DamageController._calcDialog(actor, roll, formula, async () => {
                let rank = actorData.attributes.damage.rank + Number($("#rank").val());
                rank = (rank > 10) ? 10 : rank;

                let formula = actorData.attributes.damage.high + " * " + rank + " + " + actorData.attributes.damage.add;
                if ($("#add").val() != "")
                    formula += "+" + $("#add").val();

                await actor.update({"data.attributes.destruction.value": 0});

                for (let item of actor.activeTalent)
                    if (item.data.data.disable == 'damage')
                        item.update({"data.active": false});
                        
                return {rank: rank, high: actorData.attributes.damage.high, formula: formula};
            });

        } else {
            DamageController._calcDialog(actor, roll, formula, async () => {
                if ($("#add").val() != "")
                    formula += "+" + $("#add").val();
                    
                return {rank: null, high: null, formula: formula};
            });

        }
    }


    static async _calcDialog(actor, roll, formula, callback) {
        let context = `<p>
                        <h2 style="text-align: center;">${formula}</h2>
                        <table>
                            <colgroup>
                                <col width="25%">
                                <col width="20%">
                                <col width="15%">
                                <col width="10%">
                                <col width="15%">
                                <col width="10%">
                            </colgroup>
                            <tr>
                                <th>${game.i18n.localize("KG.DamageType")}</th>
                                <td>
                                    <select id="type">
                                        <option value="acc">${game.i18n.localize("KG.Physical")}</option>
                                        <option value="cnj">${game.i18n.localize("KG.Magical")}</option>
                                    </select>
                                </td>`
        if (actor.type === "character")
            context += `<th>${game.i18n.localize("KG.AddRank")}</th><td colspan="3"><input type="text" id="rank"></td>`
            
        context += ` </tr><tr>
                        <th>${game.i18n.localize("KG.AddDamage")}</th>
                        <td colspan="5"><input type="text" id="add"></td>
                    </tr>
                    <tr style="text-align: center">
                        <th>${game.i18n.localize("KG.ReduceArmor")}</th>
                        <td><input type="text" id="armor_reduce"></td>
                        <th>${game.i18n.localize("KG.HalfArmor")}</th>
                        <td><input type="checkbox" id="armor_half"></td>
                        <th>${game.i18n.localize("KG.IgnoreArmor")}</th>
                        <td><input type="checkbox" id="armor_ignore"></td>
                    </tr>
                    <tr style="text-align: center">
                        <th>${game.i18n.localize("KG.ReduceBarrier")}</th>
                        <td><input type="text" id="barrier_reduce"></td>
                        <th>${game.i18n.localize("KG.HalfBarrier")}</th>
                        <td><input type="checkbox" id="barrier_half"></td>
                        <th>${game.i18n.localize("KG.IgnoreBarrier")}</th>
                        <td><input type="checkbox" id="barrier_ignore"></td>
                    </tr>

                </table>

                <script>$("#type").val("${roll}").prop("selected", true);</script>
            </p>`
                                    
        new Dialog({
            title: game.i18n.localize("KG.CalcDamage"),
            content: context,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: async () => {
                        let data = await callback();
                        
                        let roll = new Roll(data.formula);
                        roll.roll({async: false});

                        let content = await roll.render();
                        content += `<br><button type="button" class="apply-damage" 
                                    data-type="${$("#type option:selected").val()}" data-damage="${roll.total}" 
                                    data-rank="${data.rank}" data-high="${data.high}" 
                                    data-armor-reduce="${$("#armor_reduce").val()}" data-armor-half="${$("#armor_half").is(":checked")}" data-armor-ignore="${$("#armor_ignore").is(":checked")}" 
                                    data-barrier-reduce="${$("#barrier_reduce").val()}" data-barrier-half="${$("#barrier_half").is(":checked")}" data-barrier-ignore="${$("#barrier_ignore").is(":checked")}">${game.i18n.localize("KG.ApplyDamage")}</button>`

                        let chatData = {"content": content, "speaker": ChatMessage.getSpeaker({ actor: actor })};
                        ChatMessage.create(chatData);
                    }
                }
            },
            default: "confirm"
        }).render(true);    

    }

    static async finalDamageDialog(data, callback) {
        new Dialog({
            title: game.i18n.localize("KG.ApplyDamage"),
            content: `<p>
                      <h2 style="text-align: center;">${data.damage}</h2>

                      <table>
                        <tr>
                          <th>${game.i18n.localize("KG.Recovery")}</th>
                          <td><input type="checkbox" id="recovery"></td>
                          
                          <th>${game.i18n.localize("KG.Weakness")}</th>
                          <td><input type="checkbox" id="weak"></td>

                          <th>${game.i18n.localize("KG.Half")}</th>
                          <td><input type="checkbox" id="half"></td>
                        </tr>
                        <tr>
                          <th colspan="2">${game.i18n.localize("KG.AddDamage")}</th>
                          <td colspan="4"><input type="text" id="add" style="margin-left: 5px; width: 90%;"></td>
                        </tr>

                      </table>

                    </p>`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => DamageController.prepareDamage(data)
                }
            },
            default: "confirm"
        }).render(true);  
    }

    static async prepareDamage(data) {
        const targets = game.users.get(game.user.id).targets;
        let damage = +data.damage + +$("#add").val();
        let recovery = $("#recovery").is(":checked");

        for (var target of targets) {
            let actor = target.actor;
            let actorData = actor.data.data;
            let realDamage = damage;
            
            let r = await new Roll("1d6").roll();
            if (actor.type === "enemy" && $("#weak").is(":checked"))
                realDamage += (data.rank != null && data.rank < 10) ? +data.high : r.total;
            if ($("#half").is(":checked"))
                realDamage = Math.ceil(damage / 2.0);
            
            if (actor.type === "enemy") {
                let defense = {};
                defense.armor = actorData.attributes.defense.armor;
                defense.barrier = actorData.attributes.defense.barrier;
                defense.reduce = actorData.attributes.defense.reduce;
                defense.half = actorData.attributes.defense.half;
                defense.quarter = actorData.attributes.defense.quarter;
                
                DamageController.applyDamage(actor, data, defense, realDamage, recovery);
            } else if (actor.type === "character") {
                Hooks.call("damageApply", {actor, data, realDamage, recovery});
                game.socket.emit("system.kamigakari", {actorId: actor.id, data, realDamage, recovery});
            }
        }

        
    }
    
    static init() {
        game.socket.on("system.kamigakari", ({actorId, data, realDamage, recovery}) => {
            let actor = game.actors.get(actorId);
            Hooks.call("damageApply", {actor, data, realDamage, recovery})
        });
        
        Hooks.on("damageApply", ({actor, data, realDamage, recovery}) => {
            if (actor.id === game.user.character.id) {
                new Dialog({
                    title: game.i18n.localize("KG.DamageReduce"),
                    content: `<p>
                              <h2 style="text-align: center;">[${actor.name}] ${realDamage}</h2>
                              <table>
                                <tr>
                                  <th>${game.i18n.localize("KG.AddArmor")}</th>
                                  <td><input type="text" id="armor" ></td>
                                </tr>
                                <tr>
                                  <th>${game.i18n.localize("KG.AddBarrier")}</th>
                                  <td><input type="text" id="barrier" ></td>
                                </tr>
                                <tr>
                                  <th>${game.i18n.localize("KG.DamageReduce")}</th>
                                  <td><input type="text" id="reduce"></td>
                                </tr>
                                <tr>
                                  <th>${game.i18n.localize("KG.Half")}</th>
                                  <td><input type="checkbox" id="half" ></td>
                                </tr>
                                <tr>
                                  <th>${game.i18n.localize("KG.Quarter")}</th>
                                  <td><input type="checkbox" id="quarter" ></td>
                                </tr>

                              </table>

                            </p>`,
                    buttons: {
                        confirm: {
                            icon: '<i class="fas fa-check"></i>',
                            label: "Confirm",
                            callback: () => {
                                let defense = {};
                                defense.armor = ($("#armor").val() == "") ? 0 : +$("#armor").val();
                                defense.barrier = ($("#barrier").val() == "") ? 0 : +$("#barrier").val();
                                defense.reduce = $("#reduce").is(":checked");
                                defense.half = $("#half").is(":checked");
                                defense.quarter = $("#quarter").is(":checked");
                                
                                DamageController.applyDamage(actor, data, defense, realDamage, recovery);
                                
                            }
                        }
                    },
                    default: "confirm"
                }).render(true); 
            }
                
        })
        
    }
    
    static async applyDamage(actor, data, defense, damage, recovery) {
        let actorData = actor.data.data;
        
        let armor = actorData.attributes.armor.value + defense.armor;
        let barrier = actorData.attributes.barrier.value + defense.barrier;

        let reduce = defense.reduce;
        let half = defense.half;
        let quarter = defense.quarter;
  
        if (data.armorIgnore == "true")
            armor = 0;
        else
            armor = (armor - data.armorReduce < 0) ? 0 : armor - data.armorReduce;
        armor = (data.armorHalf == "true") ? Math.ceil(armor / 2.0) : armor;

        if (data.barrierIgnore == "true")
            barrier = 0;
        else
            barrier = (barrier - data.barrierReduce < 0) ? 0 : barrier - data.barrierReduce;
        barrier = (data.barrierHalf == "true") ? Math.ceil(barrier / 2.0) : barrier;

        let realDamage = damage;
        let life = actorData.attributes.hp.value;
        let maxLife = actorData.attributes.hp.max;
        
        if (!recovery) {
            if (data.type == "acc")
                realDamage -= armor;
            else if (data.type == "cnj")
                realDamage -= barrier

            realDamage -= reduce;
            realDamage = (half) ? Math.ceil(realDamage / 2.0) : realDamage;
            realDamage = (quarter) ? Math.ceil(realDamage / 4.0) : realDamage;
            realDamage = (realDamage < 0) ? 0 : realDamage;
            
            life = (life - realDamage < 0) ? 0 : life - realDamage;
            realDamage = "-" + realDamage;
        } else {
            life = (life + realDamage > maxLife) ? maxLife : life + realDamage;
            realDamage = "+" + realDamage;
        }
        
        await actor.update({"data.attributes.hp.value": life});
        let chatData = {"content": actor.name + " (" + realDamage + ")", "speaker": ChatMessage.getSpeaker({ actor: actor })};
        ChatMessage.create(chatData);
    }
}
