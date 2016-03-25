/*jshint devel: true, browserify:true*/

'use strict';

import * as p2 from 'p2';

//crappy hungarion notation
export let systemName = "physics";
export let needsGUI = false;

export class Attribute{
    constructor(body){
        this.body = body;
    }
}

export class System{
    constructor(){
        //physics is bigest at the bottom
        // because p2 already keeps a list of bodies, we don't reallly need entityIds for it
        this.entityIds = new Set();
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

    update(){
        this.world.step(1/60);
    }

    addEntity(entity){
        this.world.addBody(entity.attributes.get('physics').body);
        this.entityIds.add(entity.id);
    }
}
