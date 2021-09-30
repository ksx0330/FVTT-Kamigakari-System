export class KgRegisterHelpers {
  static init() {
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('local', function(arg) {
      return (arg != "") ? game.i18n.localize("KG." + arg) : "";
    });
    
    Handlebars.registerHelper('disable', function(arg) {
      let str = arg;
      switch(str) {
        case "notCheck":
          str = game.i18n.localize("KG.NotCheck");
          break;
        
        case "damage":
          str = game.i18n.localize("KG.AfterDamage");
          break;
          
        case "reduce":
          str = game.i18n.localize("KG.AfterReduce");
          break;
          
        case "round":
          str = game.i18n.localize("KG.AfterRound");
          break;
          
        case "battle":
          str = game.i18n.localize("KG.AfterBattle");
          break;

      }
        return str;
    });
  }
}
