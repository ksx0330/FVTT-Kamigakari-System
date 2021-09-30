export class KgRegisterHelpers {
  static init() {
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('local', function(arg) {
      return (arg != "") ? game.i18n.localize("KG." + arg) : "";
    });

    Handlebars.registerHelper('disable', function(arg) {
      const list = {notCheck: "KG.NotCheck", damage: "KG.AfterDamage", reduce: "KG.AfterReduce", round: "KG.AfterRound", battle: "KG.AfterBattle"};
      return game.i18n.localize(list[arg]);
    });

  }
}
