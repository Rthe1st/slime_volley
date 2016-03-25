
//crappy hungarion notation
export let systemName = "userInput";
export let needsGUI = true;

let Keys = {
  pressed: new Map(),

  isDown: function(keyCode) {
    return this.pressed.has(keyCode);
  },

  onKeydown: function(event) {
    console.log("key pressed");
    this.pressed.set(event.keyCode, true);
  },

  onKeyup: function(event) {
    console.log("key up");
    this.pressed.delete(event.keyCode);
  }
};
export class Behavior{
    constructor(entity, keyMapping){
        this.entity = entity;
        this.keyMapping = new Map(keyMapping);
        //woulod be better to attach to pixi rendering window?
        window.addEventListener('keyup', function(event) { Keys.onKeyup(event); }, false);
        window.addEventListener('keydown', function(event) { Keys.onKeydown(event); }, false);
    }
    update(){
        for(let [key, action] of this.keyMapping.entries()){
            if(Keys.isDown(key)){
                this.entity.sendMessage({'type': action});
            }
        }
    }

    recieveMessage(){}
}

export class System{
    constructor(){
        this.entities = new Map();
    }

    update(){
        for(let entity of this.entities.values()){
            entity.behaviors.get('userInput').update();
        }
    }

    addEntity(entity){
        this.entities.set(entity.id, entity);
    }
}
