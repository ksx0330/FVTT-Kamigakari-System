
export class KamigakariActor extends Actor {

  prepareData() {
    super.prepareData();
    
    if (this.type === 'character') this._prepareCharacterData();
  }

  _prepareCharacterData() {
    let values = {
      "str": { "value": this.system.attributes.str.add },
      "agi": { "value": this.system.attributes.agi.add },
      "int": { "value": this.system.attributes.int.add },
      "wil": { "value": this.system.attributes.wil.add },
      "lck": { "value": this.system.attributes.lck.add },
      "str_roll": { "value": 0 },
      "agi_roll": { "value": 0 },
      "int_roll": { "value": 0 },
      "wil_roll": { "value": 0 },
      "lck_roll": { "value": 0 },
      "acc": { "value": 0 },
      "eva": { "value": 0},
      "cnj": { "value": 0 },
      "res": { "value": 0 },
      "ins": { "value": 0 },
      "pd": { "value": 0 },
      "md": { "value": 0 },
      "init": { "value": 0 },
      "armor": { "value": 0 },
      "barrier": { "value": 0 },
      "hp": { "value": 0 },
      "rank": { "value": 0 },
      "base": { "value": 0 },
      "add": { "value": 0 },
      "rangePD": { "value": 0 },
      "reduce_armor": { "value": 0 },
      "reduce_barrier": { "value": 0 },
      "reduce_damage": { "value": 0 },
      "reduce_half": { "value": 0 },
      "reduce_quarter": { "value": 0 }
    }

    let race = null;
    let mainStyle = null;
    let roll = '-';
    let talents = [];
    let equipment = [];
    let facade = [];

    for (let i of this.items) {
      if (i.type == 'race')
        race = i;
      else if (i.type == 'style' && i.system.main)
        mainStyle = i;
      else if (i.type == 'talent' && i.system.active.state)
        talents.push(i);
      else if (i.type == 'equipment' && i.system.equipment)
        equipment.push(i);
      else if (i.type == 'facade')
        facade.push(i);
    }

    if (race != null)
      values = this._updateData(values, race.system.attributes[race.system.type]);

    if (mainStyle != null)
      values = this._updateData(values, mainStyle.system.attributes);

    for (let item of talents) {
      values = this._updateData(values, item.system.attributes);
      roll = (item.system.roll != undefined && item.system.roll != '-') ? item.system.roll : roll;
    }

    for (let effect of Object.values(this.system.attributes.effects))
      values = this._updateData(values, effect.attributes);

    for (let item of facade)
      values = this._updateData(values, item.system.attributes);


    values["acc"].value += values["str"].value;
    values["eva"].value += values["agi"].value;
    values["cnj"].value += values["int"].value;
    values["res"].value += values["wil"].value;
    values["ins"].value += values["lck"].value;

    values["pd"].value += Math.ceil(values["str"].value / 2)
    values["md"].value += Math.ceil(values["int"].value / 2)
    values["init"].value += values["agi"].value + 5;
    values["hp"].value += values["str"].value + values["wil"].value + this.system.attributes.level.value * 3;

    values["base"].value = (values["base"].value == 0) ? 1 : values["base"].value;

    for (var item of equipment)
      values = this._updateData(values, item.system.attributes);

    if (values["rangePD"].value != 0)
        values["pd"].value = values["rangePD"].value;
    delete values.rangePD;
    
    this.system.attributes.reduce.armor = values["reduce_armor"].value;
    this.system.attributes.reduce.barrier = values["reduce_barrier"].value;
    this.system.attributes.reduce.damage = values["reduce_damage"].value;
    this.system.attributes.reduce.half = (values["reduce_half"].value != 0) ? true : false;
    this.system.attributes.reduce.quarter = (values["reduce_quarter"].value != 0) ? true : false;
    
    delete values.reduce_armor;
    delete values.reduce_barrier;
    delete values.reduce_damage;
    delete values.reduce_half;
    delete values.reduce_quarter; 

    this.system.attributes.move.battle = Math.ceil( (values['init'].value + 5) / 3 );
    this.system.attributes.move.full = values['init'].value + 5;

    this.system.attributes.hp.max = values.hp.value;
    delete values.hp;

    if (this.system.attributes.damage.auto) {
      this.system.attributes.damage.base = values.base.value;
      this.system.attributes.damage.rank = values.base.value + values.rank.value;
      this.system.attributes.damage.rank += (this.system.attributes.destruction != undefined) ? this.system.attributes.destruction.value : 0;
      this.system.attributes.damage.rank = (this.system.attributes.damage.rank > 10) ? 10 : this.system.attributes.damage.rank

      this.system.attributes.damage.add = values.add.value;

      if (roll == 'acc')
        this.system.attributes.damage.add += values["pd"].value;
      else if (roll == 'cnj')
        this.system.attributes.damage.add += values["md"].value;
    }
    this.system.attributes.damage.roll = roll;

    delete values.base;
    delete values.rank;
    delete values.add;

    this.system.attributes['str'].roll = values["str_roll"].value;
    this.system.attributes['agi'].roll = values["agi_roll"].value;
    this.system.attributes['int'].roll = values["int_roll"].value;
    this.system.attributes['wil'].roll = values["wil_roll"].value;
    this.system.attributes['lck'].roll = values["lck_roll"].value;

    delete values.str_roll;
    delete values.agi_roll;
    delete values.int_roll;
    delete values.wil_roll;
    delete values.lck_roll;

    for (const [key, value] of Object.entries(values))
      this.system.attributes[key].value = value.value;
      
    this.system.attributes['str'].label = game.i18n.localize("KG.AbilitySTR");
    this.system.attributes['agi'].label = game.i18n.localize("KG.AbilityAGI");
    this.system.attributes['int'].label = game.i18n.localize("KG.AbilityINT");
    this.system.attributes['wil'].label = game.i18n.localize("KG.AbilityWIL");
    this.system.attributes['lck'].label = game.i18n.localize("KG.AbilityLCK");
    this.system.attributes['acc'].label = game.i18n.localize("KG.AbilityACC");
    this.system.attributes['eva'].label = game.i18n.localize("KG.AbilityEVA");
    this.system.attributes['cnj'].label = game.i18n.localize("KG.AbilityCNJ");
    this.system.attributes['res'].label = game.i18n.localize("KG.AbilityRES");
    this.system.attributes['ins'].label = game.i18n.localize("KG.AbilityINS");

    this.activeTalent = talents;
  }

  _updateData(values, attributes) {
    for (const [key, value] of Object.entries(attributes))
      if (key != '-')
        values[key].value += value.value;

    return values;
  }

  async _rollDice(a, ctrlClick) {
    if (!ctrlClick && !game.settings.get("kamigakari", "rollAddon")) {
      await this._doRollDice(a, undefined); 
      return;
    }
    
    new Dialog({
        title: game.i18n.localize("KG.AddRoll"),
        content: `<p><input type='text' id='add'></p><script>$("#add").focus()</script>`,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirm",
            callback: () => this._doRollDice(a, $("#add").val())
          }
        },
        default: "confirm"
    }).render(true);

  }

  async _doRollDice(a, p) {
    let dice = null;
    let formula = null;
    let flavorText = null;
    let templateData = {};

    const actorData = this.system;
    const ability = actorData.attributes[a];
    dice = ability.dice;
    formula = `${dice}6+${ability.value}`;
    if (actorData.attributes.transcend != null && actorData.attributes.transcend.value != 0) {
      formula = Number(actorData.attributes.transcend.value) + Number(dice.charAt(0)) + "D6 + " + ability.value;
      await this.update({'system.attributes.transcend.value': 0});
    }
    if (ability.roll != undefined)
        formula += '+' + ability.roll;

    if (p != null && p != "")
      formula += (p < 0) ? `${p}` : `+${p}`;

    templateData = {
      title: ability.label
    };

    // Render the roll.
    let template = 'systems/kamigakari/templates/chat/chat-move.html';
    // GM rolls.
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this })
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    let roll = new Roll(formula);
    roll.roll({async: true});

    let high = 0, count = 0;
    for (let side of roll.terms[0].results) {
      high = (side.result > high) ? side.result : high;
      count += (side.result == 6) ? 1 : 0;
    }

    high = (count >= 2) ? 10 : high;
    await this.update({"system.attributes.damage.high": high});

    roll.render().then(r => {
      templateData.rollDw = r;
      renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        if (game.dice3d) {
          game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));;
        }
        else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        }
      });
    });
  }

  _echoItemDescription(itemId) {
    const item = this.items.get(itemId);

    let title = `<div class="title">${item.name}</div>`;
    let description = item.system.description;

    if (item.type == 'talent') {
      if (item.img != 'icons/svg/item-bag.svg')
        title = `<img src="${item.img}" width="30" height="30">${title}` 

      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("KG.Timing")}</th>
                        <th>${game.i18n.localize("KG.Range")}</th>
                        <th>${game.i18n.localize("KG.Target")}</th>
                        <th>${game.i18n.localize("KG.Cost")}</th>
                      </tr>

                      <tr>
                        <td>${(item.system.timing != "") ? game.i18n.localize("KG." + item.system.timing) : ""}</td>
                        <td>${item.system.range}</td>
                        <td>${item.system.target}</td>
                        <td>${item.system.cost}</td>
                      </tr>
                    </table>${description}`
      description += `<button type="button" class="use-talent" data-actor-id="${this.id}" data-item-id="${item.id}">${game.i18n.localize("KG.UseTalent")}</button>`

      if (item.system.roll != '-')
        description += `<button type="button" class="calc-damage" data-actor-id="${this.id}" >${game.i18n.localize("KG.CalcDamage")}</button>`
    }

    else if (item.type == 'item') {
      if (item.img != 'icons/svg/item-bag.svg')
        title = `<img src="${item.img}" width="30" height="30">${title}` 
      description += `<button type="button" class="use-item" data-actor-id="${this.id}" data-item-id="${item.id}">${game.i18n.localize("KG.UseItem")}</button>`
    }

    else if (item.type == 'attackOption') {
      description = `<table style="text-align: center;">
                      <tr>
                        <th>${game.i18n.localize("KG.Timing")}</th>
                        <th>${game.i18n.localize("KG.Range")}</th>
                        <th>${game.i18n.localize("KG.Target")}</th>
                        <th>${game.i18n.localize("KG.RES")}</th>
                      </tr>

                      <tr>
                        <td>${(item.system.timing != "") ? game.i18n.localize("KG." + item.system.timing) : ""}</td>
                        <td>${item.system.range}</td>
                        <td>${item.system.target}</td>
                        <td>${item.system.resist}</td>
                      </tr>
                      
                    </table>${description}`

      if (item.system.roll != '-')
        description += `<button type="button" class="calc-damage" data-actor-id="${this.id}" data-roll="${item.system.roll}" data-formula="${item.system.formula}">${game.i18n.localize("KG.CalcDamage")}</button>`
      else if (item.system.formula != "")
        description += `<a class="inline-roll" data-title="${item.name}" data-formula="${item.system.formula}">${game.i18n.localize("KG.Formula")}</a>`
    }


    // Render the roll.
    let template = 'systems/kamigakari/templates/chat/chat-move.html';
    let templateData = {
      title: title,
      details: description
    };

    // GM rolls.
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this })
    };

    renderTemplate(template, templateData).then(content => {
      chatData.content = content;
      ChatMessage.create(chatData);

      let talentBar = $(document).find(".talent-bar");
      if (talentBar == null)
        return;


      let talent = $(`
        <div class="chat-message message flexcol item" data-item-id="${item.id}">
          <span class="remove-bar"><a class="remove-btn"><i class="fas fa-trash"></i></a></span>
          ${content}
        </div>`);

      talent.on("click", ".remove-btn", ev => {
        event.preventDefault();
        const target = ev.currentTarget.closest(".chat-message");
        target.remove();
      });

      let talents = talentBar.find(".item");
      for (let t of talents) {
        let data = t.dataset;
        if (data.itemId === item.id)
          return;
      }

      talentBar.append(talent);
      Hooks.call("updateTalentBar", talent)

    });

  }

  async _useItem(item) {
    if (item.system.quantity > 0) {
      await item.update({'system.quantity': item.system.quantity - 1});

      // Render the roll.
      let template = 'systems/kamigakari/templates/chat/chat-move.html';
      let templateData = {
        title: game.i18n.localize("KG.UseItem") + ": " + item.name,
        details: item.system.description
      };
  
      // GM rolls.
      let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this })
      };
  
      renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        ChatMessage.create(chatData);
      });

      const macro = game.macros.contents.find(m => (m.name === item.system.macro));
      if (macro != undefined)
          macro.execute();
      else if (item.system.macro != "")
          new Dialog({
              title: "alert",
              content: `Do not find this macro: ${item.system.macro}`,
              buttons: {}
          }).render(true);

    }
  
  }
  
  
  /* Spirit Burn */
  async _transcend() {
    new Dialog({
        title: 'Change Spirit Dice',
        content: `
          <h2>${game.i18n.localize("KG.TranscendAlert")}</h2>
          <div style="margin: 4px 0;"><input type="number" id="dice-num"/></div>
          <script>$("#dice-num").focus()</script>
        `,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirm",
            callback: async () => {
              var answer = $("#dice-num").val();

              if (!isNaN(answer) && answer != null && answer >= 1 && answer <= 3) {
                await this.update({'system.attributes.transcend.value': answer});

                let templateData = {
                  title: game.i18n.localize("KG.Transcend")
                };
            
                // Render the roll.
                let template = 'systems/kamigakari/templates/chat/chat-move.html';
                // GM rolls.
                let chatData = {
                  user: game.user._id,
                  speaker: ChatMessage.getSpeaker({ actor: this })
                };
            
                let rollMode = game.settings.get("core", "rollMode");
                if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
                if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
                if (rollMode === "blindroll") chatData["blind"] = true;
            
                let roll = new Roll(answer + "d6");
                await roll.roll({async: true});

                roll.render().then(r => {
                  templateData.rollDw = r;
                  renderTemplate(template, templateData).then(content => {
                    chatData.content = content;
                    if (game.dice3d) {
                      game.dice3d.showForRoll(roll, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
                    }
                    else {
                      chatData.sound = CONFIG.sounds.dice;
                      ChatMessage.create(chatData);
                    }
                  });
                });
                await this.update({'system.attributes.spirit.value': this.system.attributes.spirit.value - roll.result});
              }

            }
          }
        },
        default: "confirm"
    }).render(true);

  }

  async _vitalIgnition() {
    let templateData = {
      title: game.i18n.localize("KG.VitalIgnition")
    };

    // Render the roll.
    let template = 'systems/kamigakari/templates/chat/chat-move.html';
    // GM rolls.
    let chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this })
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    let roll = new Roll("2d6");
    await roll.roll({async: true});
    roll.render().then(r => {
      templateData.rollDw = r;
      renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        if (game.dice3d) {
          game.dice3d.showForRoll(roll, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
        }
        else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        }
      });
    });

    await this.update({'system.attributes.hp.value': this.system.attributes.str.value, 'system.attributes.spirit.value': this.system.attributes.spirit.value - roll.result});
  }

  async _conceptDestruction() {
    let templateData = {
      title: game.i18n.localize("KG.ConceptDestruction")
    };

    // Render the roll.
    let template = 'systems/kamigakari/templates/chat/chat-move.html';
    // GM rolls.
    let chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this })
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    let roll = new Roll("2d6 + 1d6");
    await roll.roll({async: true});
    roll.render().then(r => {
      templateData.rollDw = r;
      renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        if (game.dice3d) {
          game.dice3d.showForRoll(roll, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
        }
        else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        }
      });
    });

    console.log(roll);

    await this.update({'system.attributes.spirit.value': this.system.attributes.spirit.value - roll.terms[0].total, 'system.attributes.destruction.value': roll.terms[2].total});

  }



}
