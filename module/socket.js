export class SocketController {
    
    static init() {
        /** Damage */
        game.socket.on("system.kamigakari", ({id, sender, receiver, data}) => {
            if (game.user.id != receiver)
                return;
            
            switch (id) {
                case "applyDamage":
                    let actor = game.actors.get(data.actorId);
                    Hooks.call("applyDamage", {
                        actor, 
                        data: {
                            data: data.data,
                            realDamage: data.realDamage,
                            recovery: data.recovery
                        }
                    });

                    break;
                    
                case "showDices":
                    new game.kamigakari.DicesDialog([data.actorId], {}).render(true);
                    break;
                    
                case "showDefenseTiming":
                    Hooks.call("showDefense");
                    break;

                
            }
            
        });

    }
    
}
