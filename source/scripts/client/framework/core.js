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

import LocalInput from './localInput.js';
import Networking from './networking.js';
import GameClock from './gameClock.js';
import StateControl from './stateControl.js';
import ComponentManagement from '../../shared/framework/componentManagement.js';
import {EntityManager} from '../../shared/framework/entityManagement.js';

export default class Framework{

    constructor(inputAdapters, initilise, loadState, gameSystems, graphicSystems, inputSystems){
        this.initilise = initilise;
        this.loadState = loadState;
        this.networking = new Networking();
        this.gameClock = new GameClock();
        this.entityManager = new EntityManager();
        this.stateControl = new StateControl();
        this.inputAdapters = [];
        this.networking.addListener("estimateLag", this.gameClock.estimateLag.bind(this.gameClock));
        this.networking.addListener("state", function (stateInfo){
            this.stateControl.storeState(stateInfo.state);
            this.gameClock.newStateTime(stateInfo.stateGameTime);
        });

        this.networking.addListener("playerInfo", function (playerInfo){
            this.localPlayer = playerInfo.player;
            for(let inputAdapter of inputAdapters){
                this.inputAdapters.push(new inputAdapter(this.localPlayer));
            }
            this.localInput = new LocalInput();
            this.start();
        }).bind(this);
        this.inputSystems = new ComponentManagement(inputSystems);
        this.gameSystems = new ComponentManagement(gameSystems);
        this.graphicSystems = new ComponentManagement(graphicSystems);
        this.initilise(this);
    }

    start(){
        this.currentSimulated = Date.now();
        window.requestAnimationFrame(this.updateLoop.bind(this));
    }

    updateLoop(){
        let ms_per_update = 1000/60;
        this.networking.send("estimateLag", GameClock.estimateLagPacketPayload());

        if(this.stateControl.updateNeeded){
            this.loadState(this.stateControl.state);
            this.stateControl.updateNeeded = false;
            //this means game code called in simulation must not depend on gameClock
            //not really a bad thing?
            for(let rewindSimulationTime = this.gameClock.toLocalTime(this.stateControl.newestStateGameTime);
                this.currentSimulated < rewindSimulationTime;
                rewindSimulationTime += ms_per_update){

                let currentActions = this.localInput.simulateInput(rewindSimulationTime, ms_per_update);
                this.inputSystems.update(ms_per_update, currentActions);
                this.gameSystems.update(ms_per_update);
            }
        }
        for(let inputAdapter of this.inputAdapters){
            let actionPacks = inputAdapter.getActionPacks();
            this.localInput.insertNewActionPacks(inputAdapter.getActionPacks());
            for(let actionPack of actionPacks){
                //this means even with perfect lag correct, client and server will apply input at different times
                //but may be more important to send to server as soon as possible
                let inGameTime = this.gameClock.toGameTime(Date.now());
                this.networking.send("actions", {"gameTime": inGameTime, "actions": actionPack.actions, "player": actionPack.player});
            }
        }
        //you might be able to improve this by estimating how many time gameSystem will update
        //then multiplying timeStep by that
        while(Date.now() - this.currentSimulated > ms_per_update){
            let currentActions = this.localInput.simulateInput(this.currentSimulated, ms_per_update);
            this.inputSystems.update(ms_per_update, currentActions);
            this.gameSystems.update(ms_per_update);
            this.currentSimulated += ms_per_update;
        }
        //this shouldnt use ms_per_second because its outside core loop
        //should be "time since last update"
        this.graphicSystems.update(ms_per_update);
        window.requestAnimationFrame(this.updateLoop.bind(this));
    }
}
