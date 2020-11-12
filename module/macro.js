
export async function createWorldbuildingMacro(data, slot) {
  if (data.data == undefined)
    return false;

  const command = `const a = game.actors.get("${data.actorId}"); a._echoItemDescription("${data.data._id}");`;
  let macro = game.macros.entities.find(m => (m.data.name === data.data.name) && (m.data.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: data.data.name,
      type: "script",
      command: command,
      img: data.data.img
    });
  }

  game.user.assignHotbarMacro(macro, slot);
  return false;
}
