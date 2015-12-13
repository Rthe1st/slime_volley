'use strict';

import * as p2 from 'p2';

export class Component{
    constructor(entityID){
        //component knows about entity, but the entity wont know about the component
        //untill Physiscs.add()
        //because the frameworks are searched (no global list of entities)
        this.body = new p2.Body({
            mass: 1,
            position: [0, 10],
            angle: 0,
            velocity: [0, 10],
            angularVelocity: 0
        });
        this.body.addShape(new p2.Circle({ radius: 1 }));
        this.ID = entityID;
    }

    update(){
        this.body.position[0] += 1;
        console.log("world time " + this.body.world.time);
        console.log("body x, y" + this.body.position.toString());
    }
}

export class Physics{
    constructor(framework){
        this.framework = framework;
        this.componentList = {};
        this.world = new p2.World({gravity: [0,-9.78]});
        this.world.on('postStep', function(){
            for(let entityID of Object.keys(this.componentList)){
                let component = this.componentList[entityID];
                component.update();
            }
        }.bind(this));
    }

    update(){
        console.log("physics framework update");
        this.world.step(1/60);
    }

    addComponent(component){
        this.world.addBody(component.body);
        this.componentList[component.entityID] = component;
    }
}