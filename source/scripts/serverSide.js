/*jslint browserify: true, devel: true */
'use strict';

var mechanics = require('./mechanics.js');

var socket;
var queuedClientInput = [[null],[null]];//includes team and slime for each input
var lastProcessedInputs = [[],[]];

var addSocketCallbacks = function(socket){
    socket.on('receive move', function (data) {
        queuedClientInput[data.team][data.slime] = {inputSample: data.inputSample, inputNum: data.inputNum};
    });
};

var demoInputs = [{inputSample: {up:true, down:false, left: false, right:false}, time: 0},
    {inputSample: {up:false, down:false, left: true, right:false}, time: 500}
];

var demoElement = 0;
//the time the server state was taken at
//only matters relative input sample times
var serverStateTimeStamp = 0;
var simulatedTime = 0;
var fakeDateNow = 510;

//even more hacky doing step
//call the physcis engine a bunch of times, without updating anthing else
//batshiiiit
//should write some kind of testcase for this
//uses internal functions updatelogic and stage.updateTransform
var p2ForceUpdate = function(){
    var demoInputs = [{inputSample: {up:true, down:false, left: false, right:false}, time: 0},
        {inputSample: {up:false, down:false, left: true, right:false}, time: 500}//,
        //{inputSample: {up:false, down:true, left: false, right:false}, time: 1000},
        //{inputSample: {up:false, down:false, left: false, right:true}, time: 1500}
    ];

    var demoElement = 0;
    //the time the server state was taken at
    //only matters relative input sample times
    var serverStateTimeStamp = 0;
    var simulatedTime = 0;
    var fakeDateNow = 510;

    while(serverStateTimeStamp + simulatedTime < fakeDateNow){
        simulatedTime += 1000*(1.0/mechanics.game().time.desiredFps);
        if(demoInputs[demoElement].time - serverStateTimeStamp < simulatedTime){
            var inputToUse = demoInputs[demoElement];
            demoElement++;
            demoElement = demoElement%demoInputs.length;
            mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, inputToUse.inputSample);
        }
        mechanics.game().physics.p2.update();
        //alternatively, pinched from main gameloop
        //mechanics.game().updateLogic(1.0 / mechanics.game().time.desiredFps);
        //mechanics.game().stage.updateTransform();
    }
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

var inputToUse = null;

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
        mechanics.game().disableStep();
    }
};


var testUpdate = function(){
    //this should really be in a preupdate function or something
    if(mechanics.game().stepping) {
        steppingUpdate();
        if(inputToUse !== null) {
            mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, inputToUse.inputSample);
        }
    }else{
        var io = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
        if(io !== null) {
            mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, io);
        }
    }
    mechanics.localUpdate(socket.playerInfo);
};

var update = function(){
    var samplesPresent = false;
    for(var t=0;t<queuedClientInput.length; t++){
        for(var s=0;s<queuedClientInput[t].length;s++){
            var sample = queuedClientInput[t][s];
            if(sample !== null){
                samplesPresent = true;
                mechanics.moveSlime(t, s, sample.inputSample);
                lastProcessedInputs[t][s] = sample.inputNum;
                queuedClientInput[t][s] = null;
            }
        }
    }
    var inputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    if(inputSample !== null) {
        samplesPresent = true;
        mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, inputSample);
    }
    mechanics.localUpdate(socket.playerInfo);
    if(samplesPresent) {
        var packagedState = mechanics.packageState();
        socket.emit('send state', {state: packagedState, lastProcessedInputs: lastProcessedInputs});
    }
};

module.exports = {
    registerSocket: function(socketRef){
        socket = socketRef;
        addSocketCallbacks(socket);
    },
    startGame: function(){
        mechanics.startGame(update);
    },
    testStepping: function() {
        mechanics.startGame(testUpdate, doStepping);
    },
    testP2ForceUpdate: function() {
        mechanics.startGame(update, p2ForceUpdate);
    }
};