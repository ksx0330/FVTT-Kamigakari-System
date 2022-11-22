
export class KamigakariCombat extends Combat {
  
  /** @inheritdoc */
  async _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if (game.user.id != userId)
      return;
      
    var battle = null;
    var startActor = null, startLabel = "[" + game.i18n.localize("KG.Start") + "]";
    var endActor = null, endLabel = "[" + game.i18n.localize("KG.End") + "]"
    
    this.startToken = null
    this.endToken = null
    
    for (var a of game.actors) {
      if (a.name == startLabel)
        startActor = a;
      else if (a.name == endLabel)
        endActor = a;
    }
    
    if (startActor == null)
      startActor = await Actor.create({name: startLabel, type: "enemy", data: {"attributes.init.value": 99}});
    if (endActor == null)
      endActor = await Actor.create({name: endLabel, type: "enemy", data: {"attributes.init.value": -1}});


    var token = null;
    for (var a of this.scene.tokens) {
      if (a.name == startLabel)
        this.startToken = a;
      else if (a.name == endLabel)
        this.endToken = a;
    }
    
    if (this.startToken == null)
      this.startToken = (await this.scene.createEmbeddedDocuments("Token", [{alpha: 0, actorId: startActor.id}], {}))[0];
    if (this.endToken == null)
      this.endToken = (await this.scene.createEmbeddedDocuments("Token", [{alpha: 0, actorId: endActor.id}], {}))[0];

    await this.createEmbeddedDocuments("Combatant", [{actorId: startActor.id, tokenId: this.startToken.id, name: startLabel, initiative: 99}, {actorId: endActor.id, tokenId: this.endToken.id, name: endLabel, initiative: -1}], {});
    
    if ( !this.collection.viewed ) ui.combat.initialize({combat: this});
  }
	
  /** @Override */
  async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

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
      if ( !combatant?.isOwner ) return results;

      // Produce an initiative roll for the Combatant
      const roll = combatant.getInitiativeRoll(formula);
      await roll.evaluate({async: true});
      updates.push({_id: id, initiative: roll.total});
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

  /* -------------------------------------------- */	
  
   /** @Override */
  async _onDelete(options, userId) {
    super._onDelete(options, userId);
    
    await this.startToken.delete();
    await this.endToken.delete();
  }

	
}
