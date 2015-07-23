/*jslint browserify: true, devel: true*/
'use strict';

var mechanics = require('./mechanics.js');

var gameClock = require('./gameClock.js');

var socket;

var serverData;
var oldServerData;
var serverStateDirty = false;
var unackInputSamples = [];

var clientSettings = {toExtrapolate: true};

var loadGUI = function(gui){
    var folder = gui.addFolder('Client settings');
    folder.add(clientSettings, 'toExtrapolate');
    mechanics.storeGui(gui);
};

var addSocketCallbacks = function(socket){
    socket.on('receive state', function (data) {
        oldServerData = serverData;
        serverData = data;
        serverStateDirty = true;
        socket.emit('real ping', {sendTime: data.sendTime});
    });
    socket.on('sync response', function(data){
        gameClock.syncReponse(data);
    });
};

var unregisterSocket = function(socket){
    socket.removeListener('receive state');
};

var sendMove = function(samplePack){
    gameClock.piggyBackSync(samplePack);
    socket.emit('send move', samplePack);
};

var update = function(){
    //observers never need to sample input
    if(!socket.isPlayer && serverStateDirty){
        mechanics.loadNewState(serverData.state);
        serverStateDirty = false;
        return;
    }
    //before processing new input, check for new server state and re-run stored inputSamples
    //for client side extrapolation
    if(serverStateDirty){
        mechanics.loadNewState(serverData.state);
        serverStateDirty = false;
        var allAcked = true;
        for(var i=0;i<unackInputSamples.length;i++){
            if(unackInputSamples[i].timeStamp > serverData.timeStamp){
                unackInputSamples = unackInputSamples.slice(i);
                allAcked = false;
                break;
            }
        }
        if(allAcked){
            unackInputSamples = [];
        }
        //extrapolation
        if(clientSettings.toExtrapolate) {
            mechanics.fastForward(serverData.timeStamp, unackInputSamples);
        }
    }
    //now process newest local inputs
    var inputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    if(inputSample !== null){
        var samplePack = {inputSample: inputSample, timeStamp: gameClock.now(), slime: socket.playerInfo.slime, team: socket.playerInfo.team};
        unackInputSamples.push(samplePack);
        sendMove({inputSample: samplePack.inputSample, timeStamp: samplePack.timeStamp});
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
        document.getElementById('showClock').onclick = gameClock.showClock;
        document.getElementById('pingTest').onclick = function () {
            gameClock.manualSync(socket, true);
        };
        mechanics.startGame(update);
        gameClock.setUp();
        gameClock.manualSync(socket);
    },
    loadGUI: loadGUI
};