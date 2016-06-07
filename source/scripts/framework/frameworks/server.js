/*jshint devel: true, browserify:true*/

'use strict';

//notes:
//I'm worried about unknowns around message passing between systems/propogation
//and this interacting witht the "update system"
//work around for now: make all message passing "asynchrouns"
//i.e. compentnets may recive messages anytime but must only act on them in their update function
//(an alternative could be to get rid opf updates, replace with a "time has passed" message?)

//rendering should be seperated from update
//systems should note wether they require rendering. If so, call them in reneding loop
//each of their functions should have a render method (which should only depend of system/compoents state)(and not change it)
//graphical state should be kept distinct from a components game state

//exteral local (non-network) input should be read with getInput and stored in gameInput
//network should then process any input from network

//main difference between server and client is:
//when a client renders, a server "sends state"
//a client sends deltas, a server sends state (for now)
//they're replay algs differ slightly (but both effect and depend on gameInput)


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

    constructor(initilise, networking, gameClock, componentSystems, websocketServer){
        this.initilise = initilise;
        this.networking = new networking.System(websocketServer);
        this.gameClock = new gameClock();
        this.networking.registerMessageCallback("estimateLag", function(data, websocket){
            //sending this every time is a crap waste, better to send in initial connection setup
            data.serverStartTime = this.gameClock.startTime;
            data.serverTime = Date.now();
            this.networking.send("estimateLag", data, websocket.id);
        }.bind(this));
        this.networking.registerMessageCallback("input", function(data, websocket){}.bind(this));
        this.componentSystems = new Map();
        for(let componentSystem of componentSystems){
            this.componentSystems.set(componentSystem.systemName, new componentSystem.System());
        }
        //replace with uuid?
        this.nextEntityId = 0;
        this.entities = new Map();
        this.initilise(this);
        this.start();
    }

    createEntity(){
        let entity = new Entity(this.nextEntityId);
        this.entities.set(this.nextEntityId, entity);
        this.nextEntityId++;
        return entity;
    }

    //the client probably shouldnt call this untill they get a conection (and a serverStartTime)
    start(){
        this.lag = 0;
        this.previous = Date.now();
        setTimeout(this.updateLoop.bind(this), 0);
    }

    updateLoop(){
        //to get performance scaling benifits from fix timestep
        //all "graphical" systems should be update in a separte loop, post timestep update
        let ms_per_update = 1000/60;
        let current = Date.now();
        let elapsed = current - this.previous;
        this.previous = current;
        this.lag += elapsed;

        //proccess any client input here
        //console.log(this.gameClock.gameTime());
        //need to think about splitting rendering out of this loop
        while(this.lag >= ms_per_update){
            this.lag -= ms_per_update;
            //this order is determinitistic, is in insertion order
            //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
            for(let componentSystem of this.componentSystems.values()){
                if(componentSystem.needsGUI){
                    console.log("error, " + componentSystem.systemName + " needs a GUI");
                }
                componentSystem.update();
            }
        }
        this.networking.sendBroadCast("state", function(){});
        setTimeout(this.updateLoop.bind(this), 0);

    }
}