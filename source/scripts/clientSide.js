/*jslint browserify: true, devel: true*/
'use strict';

var shared = require('./shared.js');

var socket;

var serverState;
var acceptedInputSample;
var serverStateUpdated = false;
var unackInputSamples = [];
var sampleNum = 0;

var addSocketCallbacks = function(socket){
    socket.on(shared.messageTypes.playerJoined, function () {
        console.log('new player joined');
    });
    socket.on(shared.messageTypes.playerLeft, function () {
        console.log('player left');
    });
    socket.on('receive state', function (data) {
        serverState = data.state;
        serverStateUpdated = true;
        if(socket.isPlayer){
            acceptedInputSample = data.lastProcessedInput;
        }
    });
};

var unregisterSocket = function(socket){
    socket.removeListener(shared.messageTypes.playerJoined);
    socket.removeListener(shared.messageTypes.playerLeft);
    socket.removeListener('receive state');
};

var lame = 0;
var sendMove = function(inputSample, sampleNum){
    lame += 1;
    if(lame > 50){
        lame = 0;
        socket.emit('send move', {inputSample: inputSample, inputNum: sampleNum});
    }
};

var clientUpdate = function(sampleInput, loadNewState, moveSlime){
    if(!socket.isPlayer && serverStateUpdated){
        loadNewState(serverState);
        return;
    }
    //sending time stamps of how long controls held for good idea?
    //^^careful about phaser (maybe) having variable length frames
    var inputSample = sampleInput();
    //before processing new input, check for new server state and re-run stored inputSamples
    if(serverStateUpdated){
        loadNewState(serverState);
        //this wont work properly because we dont move time on appropiatly between actions?
        //crude method would be to call to <updateEngine> once per input duration in frames
        //(plus extra calls between input actions)
        unackInputSamples = unackInputSamples.slice(acceptedInputSample, unackInputSamples.length);
        for(var i=0;i<unackInputSamples.length;i++){
            moveSlime(module.exports.teamNum, module.exports.slimeNum, unackInputSamples[i]);
        }
    }
    //now process newest input
    var allfalse = !(inputSample.up || inputSample.down || inputSample.left || inputSample.right);
    if(!allfalse){
        unackInputSamples.push(inputSample);
        sendMove(inputSample, sampleNum);
    }
    sampleNum++;
    moveSlime(module.exports.teamNum, module.exports.slimeNum, inputSample);
};

module.exports = {
    registerSocket: function(socketRef, tTeamNum, tSlimeNum){
        socket = socketRef;
        module.exports.teamNum = tTeamNum;
        console.log('tTeamNum '+tTeamNum+' module.ex.teamNum '+module.exports.teamNum);
        module.exports.slimeNum = tSlimeNum;
        addSocketCallbacks(socket);
    },
    unregisterSocket: unregisterSocket,
    update: clientUpdate
};