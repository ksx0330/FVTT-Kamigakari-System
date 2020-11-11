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
      let newKey = document.createElement("div");


      if (type == 'attributes') {
        const aNk = Object.keys(this.object.data.data.attributes).length + 1;
        const attributes = `<input type="hidden" name="data.attributes.${aNk}.key" value="-" data-dType="String">`;
        newKey.innerHTML = attributes;
      } else if (type == 'additional') {
        const aNk = Object.keys(this.object.data.data.additional).length + 1;
        const additional = `<input type="hidden" name="data.additional.add${aNk}.key" value="add${aNk}"/>`;
        newKey.innerHTML = additional;
      } else if (type == 'material') {
        const mNk = Object.keys(this.object.data.data.material).length + 1;
        const material = `<input type="hidden" name="data.material.add${mNk}.key" value="material${mNk}"/>`;
        newKey.innerHTML = material;
      }

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
    console.log(formData);
    console.log(this.object);

    if (this.item.data.type != 'equipment' && this.item.data.type != 'talent')
      return this.object.update(formData);

    formData = this.updateAttributes(formData);
    if (this.item.data.type == 'equipment') {
      formData = this.updateAdditional(formData);
      formData = this.updateMaterial(formData);
    }

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
