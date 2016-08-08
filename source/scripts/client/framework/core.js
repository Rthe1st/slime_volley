/*jshint devel: true, browserify:true*/

'use strict';

import LocalInput from './localInput.js';
import Networking from './networking.js';
import GameClock from '../../shared/framework/gameClock.js';
import StateControl from './stateControl.js';
import LagEstimationCalculator from './LagEstimation.js';
import ComponentManagement from '../../shared/framework/componentSystemManagement.js';
import {EntityManager} from '../../shared/framework/entityManagement.js';
import * as networkListeners from './networkListeners.js';

export default class Framework{

    constructor(inputAdapters, initilise, loadState, gameSystems, graphicSystems, inputSystems){
        this.initilise = initilise;
        this.loadState = loadState;
        this.networking = new Networking();
        this.gameClock = new GameClock();
        this.entityManager = new EntityManager(this);
        this.stateControl = new StateControl();
        this.lagEstimation = new LagEstimationCalculator();
        this.inputAdapterClasses = inputAdapters;
        this.inputAdapters = [];//this is filled by "playerInfo"
        this.localInput = new LocalInput();
        //register dummy listeners
        //untill we're ready to handle for real (post-game start)
        this.networking.addListener("offsetEstimatePing", networkListeners.dummyListener);
        this.networking.addListener("state", networkListeners.dummyListener);
        this.networking.addListener("playerInfo", networkListeners.playerInfo.bind(this));
        this.inputSystems = new ComponentManagement(inputSystems);
        this.gameSystems = new ComponentManagement(gameSystems);
        this.graphicSystems = new ComponentManagement(graphicSystems);
        //this.networkding.send("connect", null);
    }

    start(){
        this.endOfLastUpdate = Date.now();
        console.log("dis time: " + this.gameClock.discreteTime);
        this.loopCount = 0;
        this.lastLoopStart = performance.now();
        window.requestAnimationFrame(this.updateLoop.bind(this));

    }

    updateLoop(){
        let thisLoopStart = performance.now();
        let fps = 1000 / (thisLoopStart - this.lastLoopStart);
        console.log("fps: " + fps);
        this.lastLoopStart = thisLoopStart;
        //doing this every loop is probably a waste of bandwidth
        this.networking.send("offsetEstimatePing", {"clientTime": Date.now()});
        if(this.stateControl.updateNeeded){
            this.loadState(this, this.stateControl.state);
            this.stateControl.updateNeeded = false;
            this.gameClock.frameCount = this.stateControl.frame;

            this.endOfLastUpdate = this.stateControl.timeWhenReceived;
            this.localInput.clearOldActions(this.stateControl.frame);
            //console.log(this.stateControl.state);
            this.loadState(this, this.stateControl.state);
            this.stateControl.updateNeeded = false;
            let timeTakenToGetStateToClient = this.lagEstimation.estimateLag(this.stateControl.timeWhenReceived, this.stateControl.serverTimeWhenSent);
            let framesDuringLag = Math.floor(timeTakenToGetStateToClient/this.gameClock.ms_per_frame);
            this.gameClock.frameCount = this.stateControl.frame + framesDuringLag;
            this.leftOverLag = timeTakenToGetStateToClient%this.gameClock.ms_per_frame;
            for(let fastForwardSimulationFrame = this.stateControl.frame;
                fastForwardSimulationFrame < this.gameClock.discreteTime; fastForwardSimulationFrame++){
                let simulatedInput = this.localInput.simulateInput(fastForwardSimulationFrame);
                this.inputSystems.update(this.gameClock.ms_per_frame, simulatedInput);
                this.gameSystems.update(this.gameClock.ms_per_frame);
            }
        }

        this.loopCount++;
        for(let inputAdapter of this.inputAdapters){
            //if actionPacks use current frame, then they will be 1 behind
            let stuff = inputAdapter.getActionPacks();
            if(stuff[0].actions.size > 0){
                this.localInput.insertNewActionPacks(stuff);
            }
            //+1 on discrete time?
            let frame = this.gameClock.discreteTime;
            let nextSimulatedInput = this.localInput.simulateInput(frame);
            if(nextSimulatedInput.size > 0){
                let objectVersion = {};
                for(let entry of nextSimulatedInput.entries()){
                    objectVersion[entry[0]] = entry[1];
                    let actions = entry[1];
                    for(let actionEntry of actions.entries()){
                        objectVersion[entry[0]][actionEntry[0]] = actionEntry[1];
                    }
                }
                this.networking.send("actions", {"frame": frame, "input": objectVersion});
            }
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
