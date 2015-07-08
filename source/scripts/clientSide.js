/*jslint browserify: true, devel: true*/
'use strict';

var mechanics = require('./mechanics.js');

var socket;

var serverState;
var currentAcceptedSampleNum = 0;
var lastAcceptedSampleNum = 0;
var serverStateDirty = false;
var unackInputSamples = [];

var addSocketCallbacks = function(socket){
    socket.on('receive state', function (data) {
        serverState = data.state;
        serverStateDirty = true;
        lastAcceptedSampleNum = currentAcceptedSampleNum;
        currentAcceptedSampleNum = data.lastProcessedInput;
    });
};

var unregisterSocket = function(socket){
    socket.removeListener('receive state');
};

var sendMove = function(inputSample){
    socket.emit('send move', {inputSample: inputSample, inputNum: currentAcceptedSampleNum+unackInputSamples.length});
};

var update = function(){
    //observers never need to sample input
    if(!socket.isPlayer && serverStateDirty){
        mechanics.loadNewState(serverState);
        serverStateDirty = false;
        return;
    }
    //before processing new input, check for new server state and re-run stored inputSamples
    //for client side extrapolation
    if(serverStateDirty){
        mechanics.loadNewState(serverState);
        serverStateDirty = false;
        //doesnt take into account time between use inputs
        var indexOfCurAccepted = currentAcceptedSampleNum+1-lastAcceptedSampleNum;
        unackInputSamples = unackInputSamples.slice(indexOfCurAccepted);
        for(var i=0;i<unackInputSamples.length;i++){
            mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, unackInputSamples[i].inputSample);
            mechanics.localUpdate(socket.playerInfo);
            mechanics.manualUpdateHack();
        }
    }
    //now process newest local inputs
    var inputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    if(inputSample !== null){
        var samplePack = {inputSample: inputSample, framesBetweenSamples: frameChange-1};
        unackInputSamples.push(samplePack);
        sendMove(inputSample);
        mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, inputSample);
    }
    mechanics.localUpdate(socket.playerInfo);
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