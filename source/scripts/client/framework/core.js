/*jshint devel: true, browserify:true*/

'use strict';

import LocalInput from './localInput.js';
import Networking from './networking.js';
import GameClock from '../../shared/framework/gameClock.js';
import StateControl from './stateControl.js';
import LagEstimationCalculator from './LagEstimation.js';
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
        this.lagEstimation = LagEstimationCalculator();
        this.inputAdapters = [];
        this.networking.addListener("offsetEstimatePing", function (data){
            this.lagEstimation.estimateClientServerOffset(data.clientTime, data.serverTime);
        });
        this.networking.addListener("state", function (stateInfo){
            //the frame received here will be lower then "true" current frame due to lag
            //true server frame = stateInfo.frame + (lag%ms_per_frame)
            //add estimators to account for this
            let timeWhenReceived = Date.now();
            let lag = this.lagEstimation.estimateLag(timeWhenReceived, stateInfo.serverTime);
            this.stateControl.storeState(stateInfo.state, stateInfo.frame, lag, timeWhenReceived);
        });

        this.networking.addListener("playerInfo", function (playerInfo){
            this.localPlayer = playerInfo.player;
            for(let inputAdapter of inputAdapters){
                this.inputAdapters.push(new inputAdapter(this.localPlayer, this.gameClock));
            }
            this.stateControl.storeState(playerInfo.state, playerInfo.frame);
            this.localInput = new LocalInput();
            this.start();
        }).bind(this);
        this.inputSystems = new ComponentManagement(inputSystems);
        this.gameSystems = new ComponentManagement(gameSystems);
        this.graphicSystems = new ComponentManagement(graphicSystems);
        this.initilise(this);
    }

    start(){
        this.endOfLastUpdate = Date.now();
        window.requestAnimationFrame(this.updateLoop.bind(this));
    }

    updateLoop(){
        //doing this every loop is probably a waste of bandwidth
        this.networking.send("offsetEstimatePing", {"clientTime": Date.now()});
        if(this.stateControl.updateNeeded){
            this.endOfLastUpdate = this.stateControl.timeWhenReceived;
            this.localInput.clearOldActions(this.stateControl.frame);
            this.loadState(this.stateControl.state);
            this.stateControl.updateNeeded = false;
            //use lag estimates to use this instead:
            //let fastForwardSimulationFrame = this.stateControl.frame + networkLag%ms_per_frame
            //so after loading a state, we should update:
            //this.gameClock.frameCount == stateInfo.frame + lag Account;
            let frameDuringLag = Math.floor(this.stateControl.lag/this.gameClock.ms_per_frame);
            this.gameClock.frameCount = this.stateControl.frame + frameDuringLag;
            this.leftOverLag = (this.stateControl.lag%this.gameClock.ms_per_frame);
            for(let fastForwardSimulationFrame = this.stateControl.frame;
                fastForwardSimulationFrame <= this.gameClock.discreteTime; fastForwardSimulationFrame++){

                let simulatedInput = this.localInput.simulateInput(fastForwardSimulationFrame);
                this.inputSystems.update(this.gameClock.ms_per_frame, simulatedInput);
                this.gameSystems.update(this.gameClock.ms_per_frame);
            }
        }

        for(let inputAdapter of this.inputAdapters){
            //if actionPacks use current frame, then they will be 1 behind
            this.localInput.insertNewActionPacks(inputAdapter.getActionPacks());
            //+1 on discrete time?
            let frame = this.gameClock.discreteTime;
            let nextSimulatedInput = this.localInput.simulateInput(frame);
            this.networking.send("actions", {"frame": frame, "input": nextSimulatedInput});
        }

        //doesn't account for time actually spent in the loop below
        //we should check it's negligible
        for(var lagFromUpdates = (Date.now() - this.endOfLastUpdate + this.leftOverLag);
            lagFromUpdates > this.gameClock.ms_per_frame;
            lagFromUpdates -= this.gameClock.ms_per_frame){

            let simulatedInput = this.localInput.simulateInput(this.gameClock.discreteTime);
            this.inputSystems.update(this.gameClock.ms_per_frame, simulatedInput);
            this.gameSystems.update(this.gameClock.ms_per_frame);
            this.gameClock.frameCount++;
        }

        this.endOfLastUpdate = Date.now();
        this.leftOverLag = lagFromUpdates;

        //let ms_per_frame be 10, if we get lagFromUpdates down to 5
        //then we're halfway to the next frame, so have graphics account for that
        //by drawing everything 50% ahead
        let percentToExtrapolate = this.leftOverLag/this.gameClock.ms_per_frame;
        this.graphicSystems.update(percentToExtrapolate);

        window.requestAnimationFrame(this.updateLoop.bind(this));
    }
}
