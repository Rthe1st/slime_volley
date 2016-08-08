/*jslint browserify: true, devel: true*/
'use strict';

//this timing/syncing method relies on:
//1) Any offset between the server and client performance.now()'s remaining constant
export default class StateControl{
    constructor(){
        this.updateNeeded = false;
    }
    storeState(state, frame, serverTimeWhenSent, timeWhenReceived){
        this.state = state;
        this.updateNeeded = true;
        this.frame = frame;
        this.timeWhenReceived = timeWhenReceived;
        this.serverTimeWhenSent = serverTimeWhenSent;
    }
}
