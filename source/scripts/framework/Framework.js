/*jshint devel: true, browserify:true*/

'use strict';

import *  as physicsSystem from './components/physicsSystem.js';
import *  as drawingSystem from './components/drawingSystem.js';


export default class Framework{

    constructor(initilise, componentFrameworkClasses, usingGUI=true){
        this.initilise = initilise;
        //let componentSystems = [physicsFramework.Physics];
        /*this.componentFrameworks = [];
        for(let componentFrameworkClass of componentFrameworkClasses){
            this.componentFrameworks.push(new componentFrameworkClass());
        }*/
        this.physicsSystem = new physicsSystem.System(this);
        this.drawingSystem = new drawingSystem.System(this);
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

    hasDependencies(system){
        if(system.needsGUI && !this.hasGUI){
            console.log("component needs a GUI but we don't have one");
        }
        for(let denpendency in system.dependencies){
            if(system.hasOwnProperty(denpendency)){
                console.log("component needs a " + denpendency + " system");
                return false;
            }
        }
        if(this.hasGUI){
            for(let guiDenpendency in system.guiDependencies){
                if(system.hasOwnProperty(guiDenpendency)){
                    console.log("component relies needs a " + guiDenpendency +
                                " system for gui");
                    return false;
                }
            }   
        }
        return true;
    }

    start(){
        this.initilise(this);
        window.requestAnimationFrame(this.updateLoop.bind(this));
    }

    updateLoop(){
        window.requestAnimationFrame(this.updateLoop.bind(this));
        this.physicsFramework.update();
        this.drawingFramework.update();
    }
}
