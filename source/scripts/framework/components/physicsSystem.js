/*jshint devel: true, browserify:true*/

'use strict';

import * as p2 from 'p2';

export class Attribute{
    constructor(body){
        this.body = body;
    }
}

export class System{
    constructor(){
        // because p2 already keeps a list of bodies, we don't reallly need entityIds for it
        this.entityIds = new Set();
        this.world = new p2.World({gravity: [0,9.78]});
    }

    update(){
        this.world.step(1/60);
    }

    addEntity(entity){
        this.world.addBody(entity.attributes.get('physics').body);
        this.entityIds.add(entity.id);
    }
}