/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */ 
import { DamageController } from "../combat/damage.js";

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
    // Lagacy version compatible
    if (this.actor.data.type == "enermy")
      this.actor.update({'type': 'enemy'});

    const path = "systems/kamigakari/templates/sheet/actor";
    return `${path}/${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    let isOwner = false;
    let isEditable = this.isEditable;
    let data = super.getData(options);
    let items = {};
    let actorData = {};

    isOwner = this.document.isOwner;
    isEditable = this.isEditable;

    data.isView = !this.actor.limited;

    // The Actor's data
    actorData = this.actor.data.toObject(false);
    data.actor = actorData;
    data.data = actorData.data;

    // Owned Items
    data.items = actorData.items;
    for ( let i of data.items ) {
      const item = this.actor.items.get(i._id);
      i.labels = item.labels;
    }
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    

    data.dtypes = ["String", "Number", "Boolean"];
    this._prepareCharacterItems(actorData, data.items);

    return data;
  }

  _prepareCharacterItems(actorData, items) {
    actorData.talentClassify = game.settings.get("kamigakari", "talentClassify")

    const race = [];
    const style = [];
    const facade = [];

    const talents = [];
    const raceTalents = [];
    const styleTalents = [];
    const commonTalents = [];

    const equipmentItems = [];
    const consumableItems = [];
    const sacramentItems =[];
    const commonItems = [];

    const bonds = [];

    const attackOptions = [];

    for (let i of items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type == 'race')
        race.push(i);
      else if (i.type == 'style')
        style.push(i);

      else if (i.type === 'talent') {
        if (actorData.talentClassify) {
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
        } else
            talents.push(i);
      }

      else if (i.type =='equipment')
        equipmentItems.push(i);
      else if (i.type == 'item') {
        switch (i.data.class) {
          case 'sacraments':
            sacramentItems.push(i);
            break;

          default:
            consumableItems.push(i);
            break;
        }

      }
      else if (i.type == 'bond')
        bonds.push(i);

      else if (i.type == 'attackOption')
        attackOptions.push(i);

      else if (i.type == 'facade')
        facade.push(i);
    }

    // Assign and return
    actorData.race = race;
    actorData.style = style;
    actorData.facade = facade;

    if (actorData.talentClassify) {
        actorData.raceTalents = raceTalents;
        actorData.styleTalents = styleTalents;
        actorData.talents = commonTalents;
    } else
        actorData.talents = talents;

    actorData.equipmentItems = equipmentItems;
    actorData.sacramentItems = sacramentItems;
    actorData.consumableItems = consumableItems;

    actorData.bonds = bonds;

    actorData.attackOptions = attackOptions;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find('.rollable--damage').on('click', ev => DamageController.calcDamage(this.actor, null));
    html.find('.add--overflow').on('click', async ev => {
      const add = Number(ev.currentTarget.dataset.add);
      let overflow = this.actor.data.data.attributes.overflow.value;

      if (overflow + add < 0)
        return;

      await this.actor.update({"data.attributes.overflow.value": overflow + add});
      let chatData = {"content": "Overflow : " + overflow + "->" + (overflow + add) };
      ChatMessage.create(chatData);
    });

    html.find('.active-check').on('click', async ev => {
      event.preventDefault();
      const li = event.currentTarget.closest(".item");
      const item = this.actor.items.get(li.dataset.itemId);
      await item.update({'data.active.state': !item.data.data.active.state});
    });
    
    html.find('.used-input').on('change', async ev => {
      event.preventDefault();
      const li = event.currentTarget.closest(".item");
      const item = this.actor.items.get(li.dataset.itemId);
      await item.update({'data.used.state': +$(event.currentTarget).val()});
    });

    html.find('.active-equipment').on('click', async ev => {
      event.preventDefault();
      const li = event.currentTarget.closest(".item");
      const item = this.actor.items.get(li.dataset.itemId);
      await item.update({'data.equipment': !item.data.data.equipment});
    });


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

    // Spirit burn
    html.find("#transcend").click(this._transcend.bind(this));
    html.find("#vitalIgnition").click(this._vitalIgnition.bind(this));
    html.find("#conceptDestruction").click(this._conceptDestruction.bind(this));


    // Use Item
    html.find(".use-item").click(this._useItem.bind(this));

    if (this.document.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    html.find(".defense-refresh").on('click', async ev => {
      await this.actor.update({
        "data.attributes.defense.armor": 0, 
        "data.attributes.defense.barrier": 0, 
        "data.attributes.defense.reduce": 0, 
        "data.attributes.defense.half": false
      });

      console.log(this.actor);
    });

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
    const ctrlClick = event.ctrlKey;

    if (data['ability'] != null)
      await this.actor._rollDice(data['ability'], ctrlClick);

  }

  async _onChargeSpirit(html, event) {
    event.preventDefault();
    const dices = JSON.parse(JSON.stringify(this.actor.data.data.attributes.spirit_dice.value));

    for (var i = 0; i < dices.length; ++i) {
      if (dices[i] != 0)
        continue;
      dices[i] = Math.floor(Math.random() * 6) + 1;
    }

    await this.actor.update({"data.attributes.spirit_dice.value": dices});

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
    const dices = JSON.parse(JSON.stringify(this.actor.data.data.attributes.spirit_dice.value));
    const a = event.currentTarget;
    const index = a.dataset.index;
    const oriValue = dices[index];

    new Dialog({
        title: 'Use Spirit Dice',
        content: `
          <h2>${game.i18n.localize("KG.UseSpiritAlert")}</h2>
          <h3 style="text-align: center">${oriValue}</h3>
        `,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirm",
            callback: async () => {
              dices[index] = 0;
              await this.actor.update({"data.attributes.spirit_dice.value": dices});

              var context = game.i18n.localize("KG.UseSpiritMessage") ;
              ChatMessage.create({content: context + " " + oriValue, speaker: ChatMessage.getSpeaker({actor: this.actor})});
            }
          }
        },
        default: "confirm"
    }).render(true);

  }

  async _onChangeSpirit(html, event) {
    event.preventDefault();
    const dices = JSON.parse(JSON.stringify(this.actor.data.data.attributes.spirit_dice.value));
    const a = event.currentTarget;
    const index = a.dataset.index;
    const oriValue = dices[index];

    new Dialog({
        title: 'Change Spirit Dice',
        content: `
          <h2>${game.i18n.localize("KG.ChangeSpiritAlert")}</h2>
          <div style="margin: 4px 0;"><input type="number" id="dice-num"/></div>
          <script>$("#dice-num").focus()</script>
        `,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirm",
            callback: async () => {
              var answer = $("#dice-num").val();

              if (!isNaN(answer) && answer != null && Number(answer) >= 1 && Number(answer) <= 6) {
                dices[index] = Number(answer);
                await this.actor.update({"data.attributes.spirit_dice.value": dices});

                var context = game.i18n.localize("KG.ChangeSpiritMessage") ;
                ChatMessage.create({content: context + "<br>" + oriValue + " -> " + answer, speaker: ChatMessage.getSpeaker({actor: this.actor})});
              }

            }
          }
        },
        default: "confirm"
    }).render(true);

  }

    /* -------------------------------------------- */
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);

    if (type == 'item')
      data.class = data.talenttype;
    else
      data.talentType = data.talenttype;

    const name = `New ${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    delete itemData.data["type"];
    await this.actor.createEmbeddedDocuments('Item', [itemData], {});
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
    const item = this.actor.items.get(li.dataset.itemId);
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
    let item = this.actor.items.get(li.dataset.itemId);
    item.delete();
  }

  _showItemDetails(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents('.item');
    const description = item.find('.item-description');

    toggler.toggleClass('open');
    description.slideToggle();
  }

  _echoItemDescription(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents('.item');

    this.actor._echoItemDescription(li[0].dataset.itemId);
  }

  async _useItem(event) {
    event.preventDefault();
    const useButton = $(event.currentTarget);
    const item = this.actor.items.get(useButton.parents('.item')[0].dataset.itemId);

    this.actor._useItem(item);
  
  }

  /* Spirit Burn */
  async _transcend(event) {
    event.preventDefault();
    this.actor._transcend();
  }

  async _vitalIgnition(event) {
    event.preventDefault();
    this.actor._vitalIgnition();
  }

  async _conceptDestruction(event) {
    event.preventDefault();
    this.actor._conceptDestruction();
  }

}
