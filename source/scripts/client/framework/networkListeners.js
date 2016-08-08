//this is assumed to be "framework"

function offsetEstimatePing(data){
    this.lagEstimation.estimateClientServerOffset(data.clientTime, data.serverTime);
}

function state(stateInfo){
    //the frame received here will be lower then "true" current frame due to lag
    //true server frame = stateInfo.frame + (lag%ms_per_frame)
    //add estimators to account for this
    let timeWhenReceived = performance.now();
    this.stateControl.storeState(stateInfo.state, stateInfo.frame, stateInfo.serverTime, timeWhenReceived);
}

export function dummyListener(){
    //this is used as a place holder
    //to catch events the server is sending before we're ready for them
    //i.e. in lag gap between connecting to server and starting game clientside
}

export function playerInfo(playerInfo){
    let timeWhenReceived = performance.now();
    this.localPlayer = playerInfo.player;
    for(let inputAdapter of this.inputAdapterClasses){
        this.inputAdapters.push(new inputAdapter(this.localPlayer, this.gameClock));
    }
    //instead just use the first state sent by server after this?
    console.log("player info resposne");
    console.log(playerInfo);
    console.log(playerInfo.state);
    this.stateControl.storeState(playerInfo.state, playerInfo.frame, playerInfo.serverTime, timeWhenReceived);
    this.initilise(this);
    this.start();
    this.networking.addListener("offsetEstimatePing", offsetEstimatePing.bind(this));
    this.networking.addListener("state", state.bind(this));
}
