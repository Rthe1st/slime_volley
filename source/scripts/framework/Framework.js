/*jshint devel: true, browserify:true*/

'use strict';

import *  as physicsFramework from './components/physicsFramework.js';
import *  as drawingFramework from './components/drawingFramework.js';


export default class Framework{

    constructor(initilise, componentFrameworkClasses, usingGUI=true){
        this.initilise = initilise;
        //let componentSystems = [physicsFramework.Physics];
        /*this.componentFrameworks = [];
        for(let componentFrameworkClass of componentFrameworkClasses){
            this.componentFrameworks.push(new componentFrameworkClass());
        }*/
        this.physicsFramework = new physicsFramework.Framework(this);
        this.drawingFramework = new drawingFramework.Framework(this);
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

    hasDependencies(framework){
        if(framework.needsGUI && !this.hasGUI){
            console.log("component needs a GUI but we don't have one");
        }
        for(let denpendency in framework.dependencies){
            if(framework.hasOwnProperty(denpendency)){
                console.log("component needs a " + denpendency + " framework");
                return false;
            }
        }
        if(this.hasGUI){
            for(let guiDenpendency in framework.guiDependencies){
                if(framework.hasOwnProperty(guiDenpendency)){
                    console.log("component relies needs a " + guiDenpendency +
                                " framework for gui");
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
