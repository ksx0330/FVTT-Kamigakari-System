
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
      if (a.data.name == startLabel)
        startActor = a;
      else if (a.data.name == endLabel)
        endActor = a;
    }
    
    if (startActor == null)
      startActor = await Actor.create({name: startLabel, type: "enemy", data: {}});
    if (endActor == null)
      endActor = await Actor.create({name: endLabel, type: "enemy", data: {}});


    var token = null;
    for (var a of this.scene.tokens) {
      if (a.data.name == startLabel)
        this.startToken = a;
      else if (a.data.name == endLabel)
        this.endToken = a;
    }
    
    if (this.startToken == null)
      this.startToken = (await this.scene.createEmbeddedDocuments("Token", [{alpha: 0, actorId: startActor.id}], {}))[0];
    if (this.endToken == null)
      this.endToken = (await this.scene.createEmbeddedDocuments("Token", [{alpha: 0, actorId: endActor.id}], {}))[0];
      
    console.log(this.startToken);
    console.log(this.endToken);

    await this.createEmbeddedDocuments("Combatant", [{actorId: startActor.id, tokenId: this.startToken.id, name: startLabel, initiative: 99}, {actorId: endActor.id, tokenId: this.endToken.id, name: endLabel, initiative: -1}], {});
    
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
  
   /** @Override */
  async _onDelete(options, userId) {
    super._onDelete(options, userId);
    
    await this.startToken.delete();
    await this.endToken.delete();
  }

	
}
