/*jshint devel: true, browserify:true*/

'use strict';

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

    constructor(initilise, componentSystems, usingGUI=true){
        this.usingGUI = usingGUI;
        this.initilise = initilise;
        //let componentSystems = [physicsSystem, drawingSystem, userInput];
        //make this into a map with entires for systems?
        //we need to fail obviously if system reuqired by a component doent exist
        this.componentSystems = new Map();
        for(let componentSystem of componentSystems){
            if(!usingGUI && componentSystem.needsGUI){
                console.log("error, " + componentSystem.systemName + " needs a GUI");
            }
            this.componentSystems.set(componentSystem.systemName, new componentSystem.System());
        }
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
        if(this.usingGUI){
            window.requestAnimationFrame(this.updateLoop.bind(this));
        }else{
            setTimeout(this.updateLoop.bind(this), 0);
        }
    }

    updateLoop(){
        //to get performance scaling benifits from fix timestep
        //all "graphical" systems should be update in a separte loop, post timestep update
        /*let ms_per_update = 100;
        let current = Date.now();
        let elapsed = current - this.previous;
        this.previous = current;
        this.lag += elapsed;
        while(this.lag >= ms_per_update){
            this.lag -= ms_per_update;*/
            //this order is determinitistic, is in insertion order
            //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
            for(let componentSystem of this.componentSystems.values()){
                componentSystem.update();
            }
        //}
        if(this.usingGUI){
            window.requestAnimationFrame(this.updateLoop.bind(this));
        }else{
            setTimeout(this.updateLoop.bind(this), 0);
        }

    }
}
