/*jshint devel: true, browserify:true*/

'use strict';

//component contract:
//none

import * as p2 from 'p2';

export let systemName = "physics";

export class System{
    constructor(){
        //most of this should move to entities
        //physics is biggest at the bottom
        // because p2 already keeps a list of bodies, we don't reallly need entityIds for it
        this.slimeEntities = new Map();
        this.world = new p2.World({gravity: [0,9.78]});

        let planesOptions = [
            {position: [0,0]},
            {position: [0,600],angle: Math.PI},
            {position: [800,0], angle: Math.PI*(1/2)},
            {position: [0,0],angle: -Math.PI*(1/2)}
        ];
        for(let planeOptions of planesOptions){
            let shape = new p2.Plane();
            let body = new p2.Body(planeOptions);
            body.addShape(shape);
            this.world.addBody(body);
        }
    }

    update(ms_per_update){
        //magic number, should be passed in from framework to match global lag step]
        //no update for now, I think p2.js has enough update methods built in
        this.world.step(ms_per_update);
    }

    addEntity(entity){
        if(!entity.gameComponents.has(systemName)){
            console.log("Physics could not register entity " + entity.id + ", missing component");
        }else{
            this.slimeEntities.set(entity.id, entity);
        }
    }

    removeEntity(entity){
        if(!this.slimeEntities.has(entity.id)){
            console.log("Couldn't remove entity, no entity entry");
        }else{
            entity.gameComponents.get(systemName).destroy();
            this.slimeEntities.delete(entity.id);
        }
    }
}
