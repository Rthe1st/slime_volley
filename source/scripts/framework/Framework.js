/*jshint devel: true, browserify:true*/

'use strict';

import *  as physicsSystem from './components/physicsSystem.js';
import *  as drawingSystem from './components/drawingSystem.js';
import * as userInput from './components/userInput.js';

class Entity{

    constructor(id){
        this.id = id;
        this.attributes = new Map();
        this.behaviors = new Map();
    }

    sendMessage(message){
        for(let behavior of this.behaviors.values()){
            behavior.recieveMessage(message);
        }
    }

}

export default class Framework{

    constructor(initilise, componentFrameworkClasses, usingGUI=true){
        this.initilise = initilise;
        //let componentSystems = [physicsFramework.Physics];
        /*this.componentFrameworks = [];
        for(let componentFrameworkClass of componentFrameworkClasses){
            this.componentFrameworks.push(new componentFrameworkClass());
        }*/
        this.physicsSystem = new physicsSystem.System();
        this.drawingSystem = new drawingSystem.System();
        this.userInputSystem = new userInput.System();
        //replace with uuid?
        this.nextEntityId = 0;
        this.entities = new Map();
    }

    createEntity(){
        let entity = new Entity(this.nextEntityId);
        this.entities.set(this.nextEntityId, entity);
        this.nextEntityId++;
        return entity;
    }

    start(){
        this.initilise(this);
        window.requestAnimationFrame(this.updateLoop.bind(this));
    }

    updateLoop(){
        window.requestAnimationFrame(this.updateLoop.bind(this));
        this.userInputSystem.update();
        this.physicsSystem.update();
        this.drawingSystem.update();
    }
}
