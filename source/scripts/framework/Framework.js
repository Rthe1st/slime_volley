'use strict';

import *  as physicsFramework from './components/physicsFramework.js';

export default class Framework{

    constructor(initilise, componentFrameworkClasses){
        this.initilise = initilise;
        //let componentSystems = [physicsFramework.Physics];
        /*this.componentFrameworks = [];
        for(let componentFrameworkClass of componentFrameworkClasses){
            this.componentFrameworks.push(new componentFrameworkClass());
        }*/
        this.physicsFramework = new physicsFramework.Physics(this);
        //replace with uuid?
        this.nextEntityId = 0;
        this.entityList = new Set();
    }

    createEntity(){
        let entityId = this.nextEntityId;
        this.nextEntityId++;
        this.entityList.add(entityId);
        return entityId;
    }

    start(){
        this.initilise(this);
        window.requestAnimationFrame(this.updateLoop.bind(this));
    }

    updateLoop(){
        this.physicsFramework.update();
        window.requestAnimationFrame(this.updateLoop.bind(this));
    }
}
