/*jslint browserify: true, devel: true*/
'use strict';

//this timing/syncing method relies on:
//1) Any offset between the server and client Date.now()'s remaining constant
export default class StateControl{
    constructor(){
        this.updateNeeded = false;
        this.newestStateGameTime = 0;
    }
    storeState(state, gameTime){
        this.state = state;
        this.updateNeeded = true;
        this.newestStateGameTime = gameTime
    }
}
