/*jshint devel: true, browserify:true*/

'use strict';

export let systemName = "input";

export class System{
    constructor(){
        this.slimeEntities = new Map();
    }

    update(ms_per_update, input){
        for(let entry of input.entries()){
            let player = entry[0];
            let actions = entry[1];
            for(let entity of this.slimeEntities.get(player).values()){
                entity.inputComponents.get(systemName).update(ms_per_update, actions);
            }
        }
    }

    addEntity(player, entity){
        if(!entity.inputComponents.has(systemName)){
            console.log("Input could not register entity " + entity.id + ", missing component");
        }else{
            if(!this.slimeEntities.has(player)){
                this.slimeEntities.set(player, new Map());
            }
            this.slimeEntities.get(player).set(entity.id, entity);
        }
    }

    removeEntity(player, entity){
        if(!this.slimeEntities.has(player)){
            console.log("Couldn't remove entity, no player entry");
        }else if(!this.slimeEntities.get(player).has(entity.id)){
            console.log("Couldn't remove entity, no entity entry");
        }else{
            this.slimeEntities.get(player).delete(entity.id);
        }
    }
}
