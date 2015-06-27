/*jslint browserify: true, devel: true */
'use strict';

var mechanics = require('./mechanics.js');

var socket;
//CURRENTLY RELIES ON MESSAGES ARRIVING IN ORDER, IS GURANTEED?
//(yes if all sent over same tcp?)
var queuedClientInput = [[null],[null]];//includes team and slime for each input
var lastProcessedInputs = [[],[]];
//serverSide.clients[0] = {team: team, slime: slime, inputSamples: []};

var addSocketCallbacks = function(socket){
    socket.on('receive move', function (data) {
        queuedClientInput[data.team][data.slime] = {inputSample: data.inputSample, inputNum: data.inputNum};
    });
};

var update = function(){
    for(var t=0;t<queuedClientInput.length; t++){
        for(var s=0;s<queuedClientInput[t].length;s++){
            var sample = queuedClientInput[t][s];
            if(sample === null){
                continue;
            }
            mechanics.moveSlime(t, s, sample.inputSample);
            lastProcessedInputs[t][s] = sample.inputNum;
            queuedClientInput[t][s] = null;
        }
    }
    mechanics.localUpdate(socket.playerInfo);
    var packagedState = mechanics.packageState()
    socket.emit('send state', {state: packagedState, lastProcessedInputs: lastProcessedInputs});
};

module.exports = {
    registerSocket: function(socketRef){
        socket = socketRef;
        addSocketCallbacks(socket);
    },
    startGame: function(){
        mechanics.startGame(update);
    }
};