/*jshint devel: true, browserify:true*/

'use strict';

import * as p2 from 'p2';

export class Component{
    constructor(entityID, body){
        //component knows about entity, but the entity wont know about the component
        //untill Physiscs.add()
        //because the systems are searched (no global list of entities)
        this.body = body;
        this.ID = entityID;
    }
}

export class System{
    constructor(framework){
        this.framework = framework;
        this.componentList = new Map();
        this.world = new p2.World({gravity: [0,-9.78]});
    }

    update(){
        console.log("physics system update");
        this.world.step(1/60);
    }

    addComponent(component){
        this.world.addBody(component.body);
        this.componentList.set(component.entityID, component);
    }
}