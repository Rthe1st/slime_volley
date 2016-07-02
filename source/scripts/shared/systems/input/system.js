/*jshint devel: true, browserify:true*/

'use strict';

export let systemName = "input";

export class InputSystem{
    constructor(){
        this.listeningEntities = new Map();
    }

    update(ms_per_update, input){
        for(let player, actions of input.entries()){
            for(let entity of this.listeningEntities.get(player)){
                entity.inputComponents.get(systemName).update(ms_per_update, actions);
            }
        }
    }

    addEntity(player, entity){
        if(!entity.inputComponents.has(systemName)){
            console.log("Input could not register entity " + entity.id + ", missing component")
        }else{
            if(!this.listeningEntities.has(player)){
                this.listeningEntities.set(player, new Map());
            }
            this.listeningEntities.get(player).set(entity.id, entity);
        }
    }
}
