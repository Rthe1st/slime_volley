/*jslint browserify: true, devel: true */
'use strict';

var socket;
//CURRENTLY RELIES ON MESSAGES ARRIVING IN ORDER, IS GURANTEED?
//(yes if all sent over same tcp?)
var queuedClientInput = [[null],[null]];//includes team and slime for each input
var lastProcessedInputs = [[],[]];
var teamNum;
var slimeNum;
//serverSide.clients[0] = {team: team, slime: slime, inputSamples: []};

var addSocketCallbacks = function(socket){
    socket.on('receive move', function (data) {
        queuedClientInput[data.team][data.slime] = {inputSample: data.inputSample, inputNum: data.inputNum};
    });
};

var lame = 0;
var serverUpdate = function(moveSlime, packageState, localUpdate, sampleInput){
    for(var t=0;t<queuedClientInput.length; t++){
        for(var s=0;s<queuedClientInput[t].length;s++){
            var sample = queuedClientInput[t][s];
            if(sample === null){
                continue;
            }
            moveSlime(t, s, sample.inputSample);
            lastProcessedInputs[t][s] = sample.inputNum;
            queuedClientInput[t][s] = null;
        }
    }
    //also do for local slime
    //bad copy pasta till refactor
    moveSlime(0, 0, sampleInput());
    localUpdate();
    lame += 1;
    if(lame > 50){
        lame = 0;
        socket.emit('send state', {state: packageState(), lastProcessedInputs: lastProcessedInputs});
    }
};

module.exports = {
    registerSocket: function(socketRef, tTeamNum, tSlimeNum){
        socket = socketRef;
        teamNum = tTeamNum;
        slimeNum = tSlimeNum;
        console.log('register slimeNum '+slimeNum);
        console.log('register teamNum '+teamNum);
        addSocketCallbacks(socket);
    },
    update: serverUpdate
};