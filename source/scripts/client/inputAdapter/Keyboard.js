export default class KeysAdapter {
    constructor(localPlayer){
        this.localPlayer = localPlayer;
        this.pressed = new Map();
        window.addEventListener('keyup', function(event) { this.onKeyup(event); }.bind(this), false);
        window.addEventListener('keydown', function(event) { this.onKeydown(event); }.bind(this), false);
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

    getActionPacks(){
        //should this be a map?
        //need map if we put values in it
        //but actions are "untrsuted", so what numbers can be generated untrusted?
        let actions = new Map();
        let up = 38;
        let down = 40;
        let left = 37;
        let right = 39;
        if(this.isDown(up)){
            actions.set("moveUp", true);
        }
        if(this.isDown(down)){
            actions.set("moveDown", true);
        }
        if(this.isDown(left)){
            actions.set("moveLeft", true);
        }
        if(this.isDown(right)){
            actions.set("moveRight", true);
        }
        return [{"time": Date.now(), "player": this.localPlayer, "actions":actions}];
    }
}
