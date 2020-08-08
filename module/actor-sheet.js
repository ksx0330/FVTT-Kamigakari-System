/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class KamigakariActorSheet extends ActorSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["kamigakari", "sheet", "actor"],
      width: 850,
      height: 730,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/kamigakari/templates/sheet/actor";
    return `${path}/${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    this._prepareCharacterItems(data);

    return data;
  }

  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    const raceTalents = [];
    const styleTalents = [];
    const commonTalents = [];

    const equipmentItems = [];
    const commonItems = [];

    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // If this is a move, sort into various arrays.
      if (i.type === 'talent') {
        switch (i.data.talentType) {
          case 'RACE':
            raceTalents.push(i);
            break;

          case 'STYLE':
            styleTalents.push(i);
            break;

          default:
            commonTalents.push(i);
            break;
        }
      }

      else if (i.type =='equipment')
        equipmentItems.push(i);
      else
        commonItems.push(i);
    }

    // Assign and return
    actorData.raceTalents = raceTalents;
    actorData.styleTalents = styleTalents;
    actorData.talents = commonTalents;

    actorData.equipmentItems = equipmentItems;
    actorData.commonItems = commonItems;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Toggle look.
    html.find('.toggle--look').on('click', this._toggleLook.bind(this, html));
    html.find('.rollable-ability').on('click', this._onAbilityRoll.bind(this));
    html.find('.spirit-dice').on('click', this._onChargeSpirit.bind(this, html));
    html.find('.dice-image').on('mousedown', this._onRouteSpiritDice.bind(this, html));

    // Owned Item management
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));

    // Talent
    html.find('.item-label').click(this._showItemDetails.bind(this));

    html.find(".echo-item").click(this._echoItemDescription.bind(this));

  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {
    
    // Update the Actor
    return this.object.update(formData);
  }

  /* -------------------------------------------- */

    /**
   * Listen for toggling the look column.
   * @param {MouseEvent} event
   */
  _toggleLook(html, event) {
    console.log("Toggled");
    // Add a class to the sidebar.
    html.find('.sheet-look').toggleClass('closed');

    // Add a class to the toggle button.
    let $look = html.find('.toggle--look');
    $look.toggleClass('closed');
  }

  async _onAbilityRoll(event) {
    event.preventDefault();
    const a = event.target.parentElement;
    const data = a.dataset;
    const actorData = this.actor.data.data;
    const ability = actorData.attributes[data.ability];
    let dice = null;
    let formula = null;
    let flavorText = null;
    let templateData = {};

    if (data['ability'] != null) {
      dice = actorData.attributes[`${data.ability}_dice`];
      formula = `${dice}6+${ability.value}`;
      flavorText = data.label;

      templateData = {
        title: flavorText
      };

      // Render the roll.
      let template = 'systems/kamigakari/templates/chat/chat-move.html';
      // GM rolls.
      let chatData = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      };

      let rollMode = game.settings.get("core", "rollMode");
      if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
      if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
      if (rollMode === "blindroll") chatData["blind"] = true;

      let roll = new Roll(formula);
      roll.roll();
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
    }
  }

  async _onChargeSpirit(html, event) {
    event.preventDefault();
    const actorData = this.actor.data.data;

    for (let [key, value] of Object.entries(actorData.attributes.spirit_dice.value)) {
      if (value != 0)
        continue;
      const randomDice = Math.floor(Math.random() * 6) + 1;
      await this.actor.update({[`data.attributes.spirit_dice.value.${key}`]: randomDice});
    }

    var context = game.i18n.localize("KG.RechargeSpirit") ;
    ChatMessage.create({content: context, speaker: ChatMessage.getSpeaker({actor: this.actor})});
  }

  async _onRouteSpiritDice(html, event) {
    if (event.button == 2 || event.which == 3)
      this._onUseSpirit(html, event);
    else
      this._onChangeSpirit(html, event);
  }

  async _onUseSpirit(html, event) {
    event.preventDefault();
    const dices = html.find(".dice-number");
    const a = event.currentTarget;
    const index = a.dataset.index;
    const oriValue = dices[index].value;

    const answer = confirm(game.i18n.localize("KG.UseSpiritAlert") + "\n" + oriValue);
    if (answer) {
      await this.actor.update({[`data.attributes.spirit_dice.value.[${index}]`]: 0});

      var context = game.i18n.localize("KG.UseSpiritMessage") ;
      ChatMessage.create({content: context + " " + oriValue, speaker: ChatMessage.getSpeaker({actor: this.actor})});
    }
  }

  async _onChangeSpirit(html, event) {
    event.preventDefault();
    const dices = html.find(".dice-number");
    const a = event.currentTarget;
    const index = a.dataset.index;
    const oriValue = dices[index].value;

    const answer = prompt(game.i18n.localize("KG.ChangeSpiritAlert"));
    if (!isNaN(answer) && answer != null && answer >= 1 && answer <= 6) {
      await this.actor.update({[`data.attributes.spirit_dice.value.[${index}]`]: answer});

      var context = game.i18n.localize("KG.ChangeSpiritMessage") ;
      ChatMessage.create({content: context + "<br>" + oriValue + " -> " + answer, speaker: ChatMessage.getSpeaker({actor: this.actor})});
    }
  }

    /* -------------------------------------------- */
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);

    data.talentType = data.talenttype;
    const name = `New ${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    delete itemData.data["type"];
    return this.actor.createOwnedItem(itemData);
  }

  /* -------------------------------------------- */

  /**
   * Handle editing an existing Owned Item for the Actor
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.getOwnedItem(li.dataset.itemId);
    item.sheet.render(true);
  }

  /* -------------------------------------------- */

  /**
   * Handle deleting an existing Owned Item for the Actor
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    this.actor.deleteOwnedItem(li.dataset.itemId);
  }

  _showItemDetails(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents('.item');
    const description = item.find('.item-description');

    toggler.toggleClass('open');

    // if (toggleIcon.hasClass('fa-caret-right')) {
    //   toggleIcon.removeClass('fa-caret-right').addClass('fa-caret-down');
    // } else {
    //   toggleIcon.removeClass('fa-caret-down').addClass('fa-caret-right');
    // }
    description.slideToggle();
  }

  _echoItemDescription(event) {
    event.preventDefault();
    const item = $(event.currentTarget).parents('.item');
    const description = item.find('.item-description').first();
    const title = item.find(".item-name").first();

    // Render the roll.
    let template = 'systems/kamigakari/templates/chat/chat-move.html';
    let templateData = {
      title: title.text(),
      details: description[0].innerHTML
    };

    // GM rolls.
    let chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    };

    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    renderTemplate(template, templateData).then(content => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });

  }

}
