
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
            if (item.data.data.active != undefined)
            if (active.findIndex(i => i == item.data.data.active.disable) != -1)
                updates["data.active.state"] = false;

            if (item.data.data.used != undefined)
            if (active.findIndex(i => i == item.data.data.used.disable) != -1)
                updates["data.used.state"] = 0;

            await item.update(updates);
        }

        let updates = {};
        for (let [key, effect] of Object.entries(actor.data.data.attributes.effects)) {
            if (active.findIndex(i => i == effect.disable) != -1)
                updates[`data.attributes.effects.-=${key}`] = null;
        }
        await actor.update(updates);
    }

}
