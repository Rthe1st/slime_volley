import * as clientNetworking from './clientNetworking.js';

//crappy hungarion notation
export let systemName = "userInput";
export let needsGUI = true;

export class Behavior{
    constructor(entity, keyMapping){
        this.entity = entity;
        this.keyMapping = new Map(keyMapping);
    }
    update(keys){
        for(let [key, action] of this.keyMapping.entries()){
            if(keys.isDown(key)){
                this.entity.sendMessage({'type': action});
            }
        }
    }

    recieveMessage(){}
}

class Keys {
    constructor(){
        this.pressed = new Map();
    }

    isDown(keyCode) {
        return this.pressed.has(keyCode);
    }

    onKeydown(event) {
        this.pressed.set(event.keyCode, true);
    }

    onKeyup(event) {
        this.pressed.delete(event.keyCode);
    }
}

export class System{
    constructor(){
        this.clientNetworking = new clientNetworking.System();
        this.entities = new Map();
        this.keys = new Keys();
        //woulod be better to attach to pixi rendering window?
        window.addEventListener('keyup', function(event) { this.keys.onKeyup(event); }.bind(this), false);
        window.addEventListener('keydown', function(event) { this.keys.onKeydown(event); }.bind(this), false);
    }

    update(){
        //this.clientNetworking.send_input('dog');
        for(let entity of this.entities.values()){
            entity.behaviors.get('userInput').update(this.keys);
        }
    }

    addEntity(entity){
        this.entities.set(entity.id, entity);
    }
}
