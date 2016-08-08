/*jshint devel: true, browserify:true*/

'use strict';

//component contract:
//update()

import * as pixi from 'pixi.js';

export let systemName = "drawing";

export class System{

    constructor(){
        this.slimeEntities = new Map();
        this.stage = new pixi.Container();
        this.renderer = pixi.autoDetectRenderer(800, 600,{backgroundColor : 0x1099bb});
        document.body.appendChild(this.renderer.view);
    }

    update(timeStep, actions){
        for(let entity of this.slimeEntities.values()){
            entity.graphicComponents.get(systemName).update();
        }
        this.renderer.render(this.stage);
    }

    removeEntity(entity){
        if(!this.slimeEntities.has(entity.id)){
            console.log("Couldn't remove entity, no entity entry");
        }else{
            entity.graphicComponents.get(systemName).destroy();
            this.slimeEntities.delete(entity.id);
        }
    }

    addEntity(entity){
        if(!entity.graphicComponents.has(systemName)){
            console.log("Drawing could not register entity " + entity.id + ", missing component");
        }else{
            this.slimeEntities.set(entity.id, entity);
        }
    }
}
