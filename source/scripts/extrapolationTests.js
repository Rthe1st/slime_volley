/*jslint browserify: true, devel: true */
'use strict';

/* add this to html file
*         <button id="testP2Update">testp2Update</button>
 <button id="testWorldStep">testworldStep</button>
 <button id="testNormal">test normal step</button>
 <button id="testPhaserUpdate">test phaser update</button>*/

var mechanics = require('./mechanics.js');

var demoInputs = [{inputSample: {up:true, down:false, left: false, right:false}, time: 0},
    {inputSample: {up:false, down:false, left: true, right:false}, time: 500}
];

//the time the server state was taken at
//only matters relative input sample times
var serverStateTimeStamp = 0;

var fakeDateNow = 312.5;//multiple of 64 to avoid interpolation difference

//even more hacky doing step
//call the physcis engine a bunch of times, without updating anthing else
//batshiiiit
//should write some kind of testcase for this
//uses internal functions updatelogic and stage.updateTransform
var p2ForceUpdate = function(){
    mechanics.onGoalReset();
    console.log('p2ForceUpdate');
    console.log('initial position');
    mechanics.printSlimeXY(0, 0);

    var demoElement = 0;
    var simulatedTime = 0;

    while(serverStateTimeStamp + simulatedTime < fakeDateNow){
        simulatedTime += 1000*(1.0/mechanics.game().time.desiredFps);
        if(demoInputs[demoElement].time - serverStateTimeStamp < simulatedTime){
            var inputToUse = demoInputs[demoElement];
            demoElement++;
            demoElement = demoElement%demoInputs.length;
            mechanics.moveSlime(0, 0, inputToUse.inputSample);
        }
        mechanics.game().physics.p2.update();
        //alternatively, pinched from main gameloop
        //mechanics.game().updateLogic(1.0 / mechanics.game().time.desiredFps);
        //mechanics.game().stage.updateTransform();
    }
    console.log('final position: ');
    mechanics.printSlimeXY(0, 0);
};

var p2ForceWorldStep = function(){
    mechanics.onGoalReset();
    console.log('p2ForceUpdate');
    console.log('initial position');
    mechanics.printSlimeXY(0, 0);

    var simulatedTime = serverStateTimeStamp;
    for(var input of demoInputs){
        var timeToSimulate = input.time - simulatedTime;
        mechanics.game().physics.p2.world.step(1.0/mechanics.game().time.desiredFps, timeToSimulate, 1000);
        simulatedTime = input.time;
        mechanics.moveSlime(playerInfo.team, playerInfo.slime, input.inputSample);
    }
    //all inputs simulate, now catch up from last input to current time
    timeToSimulate = fakeDateNow - simulatedTime;
    mechanics.game().physics.p2.world.step(1.0/mechanics.game().time.desiredFps, timeToSimulate, 1000);
    console.log('final position: ');
    mechanics.printSlimeXY(0, 0);
};

var mimicPhaserUpdate = function(){
    mechanics.onGoalReset();
    console.log('p2ForceUpdate');
    console.log('initial position');
    mechanics.printSlimeXY(0, 0);

    var demoElement = 0;

    var simulatedTime = 0;

    while(serverStateTimeStamp + simulatedTime < fakeDateNow){
        simulatedTime += 1000*(1.0/mechanics.game().time.desiredFps);
        if(demoInputs[demoElement].time - serverStateTimeStamp < simulatedTime){
            var inputToUse = demoInputs[demoElement];
            demoElement++;
            demoElement = demoElement%demoInputs.length;
            mechanics.moveSlime(0, 0, inputToUse.inputSample);
        }
        mechanics.game().updateLogic(1.0 / mechanics.game().time.desiredFps);
        mechanics.game().stage.updateTransform();
    }
    console.log('final position: ');
    mechanics.printSlimeXY(0, 0);
};

//doSteping works, but doesnt not force updates any faster then realtime
//i.e. still relies on main update loop

//not sure where to call this from, socket callback on receiving server state?
var doStepping = function(){
    //we need this to keep going until we've caught up with "now"
    //doesn't seem to be a phaser (exposed) way to measure that
    //so use date.now for the time being?
    mechanics.game().enableStep();
};

function enableSteppingUpdate(){
    mechanics.onGoalReset();
    console.log('p2ForceUpdate');
    console.log('initial position');
    mechanics.printSlimeXY(0, 0);

    mechanics.game().enableStep();
}

var inputToUse = null;

var simulatedTime = 0;
var demoElement = 0;

var steppingUpdate = function(){
    inputToUse = null;
    if(serverStateTimeStamp + simulatedTime < fakeDateNow){
        simulatedTime += 1000*(1.0/mechanics.game().time.desiredFps);
        if(demoInputs[demoElement].time - serverStateTimeStamp < simulatedTime){
            inputToUse = demoInputs[demoElement];
            demoElement++;
            demoElement = demoElement%demoInputs.length;
        }else{
            inputToUse = null;
        }
        mechanics.game().step();
    }else{
        console.log('final position: ');
        mechanics.printSlimeXY(0, 0);
        mechanics.game().disableStep();
        simulatedTime = 0;
        demoElement = 0;
        inputToUse = null;
    }
};

var playerInfo = {slime:0, team: 0};

var update = function(){
    //this should really be in a preupdate function or something
    if(mechanics.game().stepping) {
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

mechanics.startGame(update, test);

function test(){
    document.getElementById('testP2Update').onclick = p2ForceUpdate;
    document.getElementById('testWorldStep').onclick = p2ForceWorldStep;
    document.getElementById('testNormal').onclick = enableSteppingUpdate;
    document.getElementById('testPhaserUpdate').onclick = mimicPhaserUpdate;
}