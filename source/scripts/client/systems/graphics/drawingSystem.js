/*jshint devel: true, browserify:true*/

'use strict';

//component contract:
//update()

import * as pixi from 'pixi.js';

export let systemName = "drawing";

export class System{

    constructor(){
        this.listeningEntities = new Map();
        this.stage = new pixi.Container();
        this.renderer = pixi.autoDetectRenderer(800, 600,{backgroundColor : 0x1099bb});
        document.body.appendChild(this.renderer.view);
    }

    update(timeStep, actions){
        for(let entity of this.listeningEntities){
            entity.components.get(systemName).update();
        }
        this.renderer.render(this.stage);
    }

    addEntity(entity){
        if(!entity.components.has(systemName)){
            console.log("Drawing could not register entity " + entity.id + ", missing component")
        }else{
            this.listeningEntities.set(entity.id, entity);
        }
    }
}
