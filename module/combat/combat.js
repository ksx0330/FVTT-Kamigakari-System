
export class KamigakariCombat extends Combat {
  
  /** @inheritdoc */
  async _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if (game.user.id != userId)
      return;
    
    let startActor = null, startLabel = "[" + game.i18n.localize("KG.Start") + "]";
    let endActor = null, endLabel = "[" + game.i18n.localize("KG.End") + "]"
    
    for (let a of game.actors) {
      if (a.name == startLabel)
        startActor = a;
      else if (a.name == endLabel)
        endActor = a;
    }
  
    if (startActor == null)
      startActor = await Actor.create({name: startLabel, type: "enemy", img: "icons/svg/clockwork.svg", system: { init: { value: 999 } }});
    if (endActor == null)
      endActor = await Actor.create({name: endLabel, type: "enemy", img: "icons/svg/clockwork.svg", system: { init: { value: -999 } }});

    await this.setFlag("kamigakari", "startActor", startActor.uuid);
    await this.setFlag("kamigakari", "endActor", endActor.uuid);

    await this.createEmbeddedDocuments("Combatant", [
      {actorId: startActor.id, name: startLabel, img: startActor.img, initiative: 999}, 
      {actorId: endActor.id, name: endLabel, img: startActor.img, initiative: -999}
    ], {});
    
    if ( !this.collection.viewed ) ui.combat.initialize({combat: this});
  }
	
  /** @Override */
  async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
    let startActorUUID = this.flags["kamigakari"].startActor;
    let endActorUUID = this.flags["kamigakari"].endActor;

    let startActor = await fromUuid(startActorUUID);
    let endActor = await fromUuid(endActorUUID);

    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    const currentId = this.combatant?.id;
    const rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");

    // Iterate over Combatants, performing an initiative roll for each
    const updates = [];
    const messages = [];
    for ( let [i, id] of ids.entries() ) {

      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if ( !combatant?.isOwner ) return this;

      // Produce an initiative roll for the Combatant
      const roll = combatant.getInitiativeRoll(formula);
      await roll.evaluate();
      
      let init = roll.total;
      if (combatant.actorId == startActor.id)
        init = 999;
      else if (combatant.actorId == endActor.id)
        init = -999;

      updates.push({_id: id, initiative: init});
    }
    if ( !updates.length ) return this;

    // Update multiple combatants
    await this.updateEmbeddedDocuments("Combatant", updates);

    // Ensure the turn order remains with the same combatant
    if ( updateTurn && currentId ) {
      await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
    }

    // Create multiple chat messages
    await ChatMessage.implementation.create(messages);
    return this;
  }
  
  _sortCombatants(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    let ci = ib - ia;
    if ( ci !== 0 ) return ci;
    
    if (a.actor.type !== b.actor.type) {
      if (a.actor.type === "character")
        return -1;
      else
        return 1;
    }
    let cn = a.name.localeCompare(b.name);   
    if ( cn !== 0 ) return cn;
    return a.id - b.id;
  }
}
