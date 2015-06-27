/*jslint browserify: true, devel: true*/
'use strict';

var mechanics = require('./mechanics.js');

var socket;

var serverState;
var acceptedInputSample;
var serverStateUpdated = false;
var unackInputSamples = [];
var sampleNum = 0;

var addSocketCallbacks = function(socket){
    socket.on('receive state', function (data) {
        serverState = data.state;
        serverStateUpdated = true;
        acceptedInputSample = data.lastProcessedInput;
    });
};

var unregisterSocket = function(socket){
    socket.removeListener('receive state');
};

var sendMove = function(inputSample, sampleNum){
    socket.emit('send move', {inputSample: inputSample, inputNum: sampleNum});
};

var update = function(){
    mechanics.loadNewState(serverState);
    //observers never need to sample input
    if(!socket.isPlayer && serverStateUpdated){
        return;
    }
    //sending time stamps of how long controls held for good idea?
    //^^careful about phaser (maybe) having variable length frames
    //before processing new input, check for new server state and re-run stored inputSamples
    if(serverStateUpdated){
        //this wont work properly because we dont move time on appropiatly between actions?
        //crude method would be to call to <updateEngine> once per input duration in frames
        //(plus extra calls between input actions)
        unackInputSamples = unackInputSamples.slice(acceptedInputSample, unackInputSamples.length);
        for(var i=0;i<unackInputSamples.length;i++){
            mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, unackInputSamples[i]);
        }
    }
    //now process newest input
    var inputSample = mechanics.sampleInput();
    var allfalse = !(inputSample.up || inputSample.down || inputSample.left || inputSample.right);
    if(!allfalse){
        unackInputSamples.push(inputSample);
        sendMove(inputSample, sampleNum);
    }
    sampleNum++;
    mechanics.localUpdate(socket.playerInfo, inputSample);
};

module.exports = {
    registerSocket: function(socketRef){
        socket = socketRef;
        addSocketCallbacks(socket);
    },
    unregisterSocket: unregisterSocket,
    startGame: function(){
        mechanics.startGame(update);
    }
};