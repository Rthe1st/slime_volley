/*jshint devel: true, browserify:true*/

'use strict';

export let systemName = "slimes";

export class System{
    constructor(){
        this.slimeEntities = new Map();
        this.findPlayerSlime = new Map();
    }

    //dummy method because systems are expected to have one
    //todo: put into framework a way of not calling systems that dont need it
    //perhaps a new type, "semantic" or such in addition to input, game and graphics?
    update(){}

    addEntity(entity){
        if(!entity.gameComponents.has(systemName)){
            console.log("Slimes could not register entity " + entity.id + ", missing component");
        }else{
            this.slimeEntities.set(entity.id, entity);
            this.findPlayerSlime.set(this.slimeEntities.get(entity.id).gameComponents.get(systemName).player, entity.id);
        }
    }

    removeEntity(entity){
        if(!this.slimeEntities.has(entity.id)){
            console.log("Couldn't remove entity, no entity entry");
        }else{
            this.findPlayerSlime.delete(this.slimeEntities.get(entity.id).player);
            this.slimeEntities.delete(entity.id);
        }
    }

    save(){
        let savedEntities = [];
        for(let slimeEntity of this.slimeEntities.values()){
            savedEntities.push(slimeEntity.gameComponents.get(systemName).save());
        }
        return savedEntities;
    }
}
