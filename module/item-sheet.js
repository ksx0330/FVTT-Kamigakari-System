/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class KamigakariItemSheet extends ItemSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
			classes: ["kamigakari", "sheet", "item"],
			width: 520,
			height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
  }
  
    /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/kamigakari/templates/sheet/item";
    return `${path}/${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];

    return data;
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
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add or Remove Attribute
    html.find(".attributes").on("click", ".attribute-control", this._onClickAttributeControl.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  async _onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    const type = a.dataset.type;
    const form = this.form;

    // Add new attribute
    if ( action === "create" ) {
      const aNk = Object.keys(this.object.data.data.additional).length + 1;
      const mNk = Object.keys(this.object.data.data.material).length + 1;
      let newKey = document.createElement("div");
      const attributes = `
      <select class="attribute-key" name="data.attributes.{{key}}.key" data-dtype="String">
      {{#select data.key}}
        <option value="-">-</option>
        <option value="hp">{{localize "KG.HP"}}</option>
        <option value="acc">{{localize "KG.ACC"}}</option>
        <option value="eva">{{localize "KG.EVA"}}</option>
        <option value="cnj">{{localize "KG.CNJ"}}</option>
        <option value="res">{{localize "KG.RES"}}</option>
        <option value="ins">{{localize "KG.INS"}}</option>
        <option value="pd">{{localize "KG.PD"}}</option>
        <option value="md">{{localize "KG.MD"}}</option>
        <option value="init">{{localize "KG.Init"}}</option>
        <option value="armor">{{localize "KG.Armor"}}</option>
        <option value="barrier">{{localize "KG.Barrier"}}</option>
        <option value="str">{{localize "KG.STR"}}</option>
        <option value="agi">{{localize "KG.AGI"}}</option>
        <option value="int">{{localize "KG.INT"}}</option>
        <option value="wil">{{localize "KG.WIL"}}</option>
        <option value="lck">{{localize "KG.LCK"}}</option>
      {{/select}}
      </select>`;
  
       const additional = `<input type="hidden" name="data.additional.add${aNk}.key" value="add${aNk}"/>`;
       const material = `<input type="hidden" name="data.material.add${mNk}.key" value="material${mNk}"/>`;

      if (type == 'attributes')
        newKey.innerHTML = attributes;
      else if (type == 'additional')
        newKey.innerHTML = additional;
      else if (type == 'material')
        newKey.innerHTML = material;

      newKey = newKey.children[0];
      form.appendChild(newKey);
      await this._onSubmit(event);
    }

    // Remove existing attribute
    else if ( action === "delete" ) {
      const li = a.closest(".attribute");
      li.parentElement.removeChild(li);
      await this._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {

    if (this.item.data.type != 'equipment')
      return this.object.update(formData);

    formData = this.updateAttributes(formData);
    formData = this.updateAdditional(formData);
    formData = this.updateMaterial(formData);


    // Update the Item
    return this.object.update(formData);
  }

  updateAttributes(formData) {
    // Handle the free-form attributes list
    const formAttrs = expandObject(formData).data.attributes || {};

    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let k = v["key"].trim();
      if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
      delete v["key"];
      obj[k] = v;
      return obj;
    }, {});

    // Remove attributes which are no longer used
    for ( let k of Object.keys(this.object.data.data.attributes) ) {
      if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.attributes")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: this.object._id, "data.attributes": attributes});

    return formData;
  }

  updateAdditional(formData) {
    // Handle the free-form attributes list
    const formAttrs = expandObject(formData).data.additional || {};

    const additional = Object.values(formAttrs).reduce((obj, v) => {
      let k = v["key"].trim();
      if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
      delete v["key"];
      obj[k] = v;
      return obj;
    }, {});
    
    // Remove attributes which are no longer used
    for ( let k of Object.keys(this.object.data.data.additional) ) {
      if ( !additional.hasOwnProperty(k) ) additional[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.additional")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: this.object._id, "data.additional": additional});

    return formData;
  }
  
  updateMaterial(formData) {
    // Handle the free-form attributes list
    const formAttrs = expandObject(formData).data.material || {};

    const material = Object.values(formAttrs).reduce((obj, v) => {
      let k = v["key"].trim();
      if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
      delete v["key"];
      obj[k] = v;
      return obj;
    }, {});
    
    // Remove attributes which are no longer used
    for ( let k of Object.keys(this.object.data.data.material) ) {
      if ( !material.hasOwnProperty(k) ) material[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData).filter(e => !e[0].startsWith("data.material")).reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {_id: this.object._id, "data.material": material});

    return formData;
  }

}
