
export class DisableHooks {
    static init() {
        Hooks.on("afterDamage", async actor => {
            await this.disableTalents(actor, ['damage'], []);
        });

        Hooks.on("afterReduce", async actor => {
            await this.disableTalents(actor, ['reduce'], []);
        });

        Hooks.on("afterRound", async actors => {
            for (let actor of actors)
                await this.disableTalents(actor, ['damage','reduce', 'round'], ['round']);
        });

        Hooks.on("afterCombat", async actors => {
            for (let actor of actors)
                await this.disableTalents(actor, ['damage','reduce', 'round', 'battle'], ['round', 'battle']);
        });

        Hooks.on("afterSession", async () => {
            for (let actor of game.actors) {
                if (actor.type !== "enemy")
                await this.disableTalents(actor, ['damage','reduce', 'round', 'battle'], ['round', 'battle', 'session']);
            }
        });

    }

    static async disableTalents(actor, active, used) {
        for (let item of actor.items) {
            let updates = {};
            if (item.system.active != undefined)
            if (active.findIndex(i => i == item.system.active.disable) != -1)
                updates["system.active.state"] = false;

            if (item.system.used != undefined)
            if (used.findIndex(i => i == item.system.used.disable) != -1)
                updates["system.used.state"] = 0;

            await item.update(updates);
        }

        if (actor.type == "enemy")
            return;
            
        let updates = {};
        for (let [key, effect] of Object.entries(actor.system.attributes.effects)) {
            if (active.findIndex(i => i == effect.disable) != -1)
                updates[`system.attributes.effects.-=${key}`] = null;
        }
        await actor.update(updates);
    }

}
