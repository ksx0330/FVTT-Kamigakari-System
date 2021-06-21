
export class KamigakariCombat extends Combat {
  
  /** @inheritdoc */
  async _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if (game.user.id != userId)
      return;
    
    var battle = null;
    var startLabel = "[" + game.i18n.localize("KG.Start") + "]", endLabel = "[" + game.i18n.localize("KG.End") + "]";
    for (var a of game.actors) {
      if (a.data.name == "[battle]") {
        battle = a;
        break;
      }
    }
    
    if (battle == null)
      battle = await Actor.create({name: "[battle]", type: "enemy", data: {}});
    
    await this.createEmbeddedDocuments("Combatant", [{actorId: battle.id, name: startLabel, initiative: 99}], {});
    await this.createEmbeddedDocuments("Combatant", [{actorId: battle.id, name: endLabel, initiative: -1}], {});
    
    if ( !this.collection.viewed ) ui.combat.initialize({combat: this});
  }
	
  /** @Override */
  async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    const currentId = this.combatant.id;
    const rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");

    // Iterate over Combatants, performing an initiative roll for each
    const updates = [];
    const messages = [];
    for ( let [i, id] of ids.entries() ) {

      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if ( !combatant?.isOwner ) return results;

      // Produce an initiative roll for the Combatant
      const roll = combatant.getInitiativeRoll(formula);
      updates.push({_id: id, initiative: roll.total});
    }
    if ( !updates.length ) return this;

    // Update multiple combatants
    await this.updateEmbeddedDocuments("Combatant", updates);

    // Ensure the turn order remains with the same combatant
    if ( updateTurn ) {
      await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
    }

    // Create multiple chat messages
    await ChatMessage.implementation.create(messages);
    return this;
  }

  /* -------------------------------------------- */	
	
}
