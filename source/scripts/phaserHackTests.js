/*jslint browserify: true, devel: true */
'use strict';

//todo: add 2 mechanics, 1 useing client 1 using server (after testing client on eworks)

import {Mechanics} from './gamePlay/mechanics.js';

import hackedPhaser from 'hackedPhaser';

var demoInputs = [{inputSample: {up:true, down:false, left: false, right:false}, time: 0},
    {inputSample: {up:false, down:false, left: true, right:false}, time: 500}
];
var gameClock;

var desiredFPS = 60;

var simulatedTime = 0;

var inputToUse = null;

var maxSimulateTime = 600;
var demoElement = 0;

var mechanics;

var steppingUpdate = function(){
    inputToUse = null;
    if(simulatedTime < maxSimulateTime){
        simulatedTime += 1000*(1.0/desiredFPS);
        if(demoInputs[demoElement].time - serverStateTimeStamp < simulatedTime){
            inputToUse = demoInputs[demoElement];
            demoElement++;
            demoElement = demoElement%demoInputs.length;
        }else{
            inputToUse = null;
        }
    }else{
        console.log('final position: ');
        mechanics.printSlimeXY(0, 0);
        simulatedTime = 0;
        demoElement = 0;
        inputToUse = null;
    }
};

var playerInfo = {slime:0, team: 0};

var update = function(){
    //this should really be in a preupdate function or something
    if(mechanics.isPendingStep()) {
        steppingUpdate();
        if(inputToUse !== null) {
            mechanics.moveSlime(playerInfo.team, playerInfo.slime, inputToUse.inputSample);
        }
    }else{
        var inputSample = mechanics.sampleInput(playerInfo.team, playerInfo.slime);
        if(inputSample !== null) {
            mechanics.moveSlime(playerInfo.team, playerInfo.slime, inputSample);
        }
    }
    mechanics.localUpdate(playerInfo);
};

(function startGame(){
    gameClock = new GameClock(Date.now());
    mechanics = new Mechanics(hackedPhaser, gameClock.now.bind(gameClock), true);
    mechanics.startGame(update);
})();