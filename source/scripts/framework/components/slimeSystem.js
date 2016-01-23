/*jshint devel: true, browserify:true*/

'use strict';

import * as p2 from 'p2';

export class Component{
    constructor(entityID, framework){
        this.needsGUI = false;
        this.requiredDependencies = ["physicsSystem"];
        this.guiDependencies = ["drawingSystem"];
        if(!framework.hasDependencies(this)){
            this.console.log("slimeSystem component failed dependency check");
            return;
        }
        //create dependant components
        for(let dependency of this.requiredDependencies){
            let physicsComponent = new framework[dependency].Component(entityID);
        }
        //body attribtue
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

    addToSystem(){
        for(let component of this.dependantComponents){
            component.addToSystem();
        }
    }

    removeFromSystem(){
        for(let component of this.dependantComponents){
            component.removeFromSystem();
        }
    }

    update(){
    }
}

export class Framework{
    constructor(framework){
        this.framework = framework;
        this.componentList = new Map();
    }

    update(){
    }

    addComponent(component){
        this.componentList(component.entityID, component);
    }
}