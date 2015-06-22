/*jslint node: true */
/* global io*/
'use strict';

exports.socket = io.connect();

exports.clientSide = {
    var playerSlime;
    var serverState;
    var acceptedInputSample;
    var serverStateUpdated = false;
    var unackInputSamples = [];

    socket.on(messageTypes.observerSet, function () {
        console.log('players full, you\'ve been placed in the observer queue');
        //could this use socket variables instead?
        isPlayer = false;
    });
    socket.on(messageTypes.playerSet, function (team, player, auth) {
        console.log('you\'ve joined as a player');
        //could this use socket variables instead?
        isPlayer = true;
        isAuth = auth;
        playerSlime = teams[team].slimes[player];
        
    });
    socket.on(messageTypes.playerJoined, function () {
        console.log('new player joined');
    });
    socket.on(messageTypes.playerLeft, function () {
        console.log('player left');
    });
    var lame = 0;
    var sendMove = function(inputSample){
        if(!isPlayer){
            return;
        }
        lame += 1;
        if(lame > 50){
            lame = 0;
            socket.emit('send move', inputSample);
        }
    };

    socket.on('receive state', function (lastServerState, lastAcceptedInputSample) {
        serverState = lastServerState;
        acceptedInputSample = lastAcceptedInputSample;
        serverStateUpdated = true;
    });

    var clientUpdate = function(){
        //sending time stamps of how long controls held for good idea?
        //^^careful about phaser (maybe) having variable length frames
        var inputSample = {up:false, down:false, left:false, right:false};
        Object.keys(playerSlime.controls).forEach(function(key){
            if(playerSlime.controls[key].isDown){
                inputSample[key] = true;
            }
        });
        //before processing new input, check for new server state and re-run stored inputSamples
        if(serverStateUpdated){
            unackInputSamples = unackInputSamples.splice(acceptedInputSample);
            for(var i=0;i<unackInputSamples.length;i++){
                playerSlime.move(unackInputSamples[i]);
            }
        }
        //now process newest input
        unackInputSamples[unackInputSamples.length] = inputSample;
        sendMove(inputSample);
        playerSlime.move(inputSample);
    };
};

exports.serverSide = {   
    //CURRENTLY RELIES ON MESSAGES ARRIVING IN ORDER, IS GURANTEED?
    //(yes if all sent over same tcp?)
    clients: [],
    queuedClientInput:[]//includes team and slime for each input
    //serverSide.clients[0] = {team: team, slime: slime, inputSamples: []};

    socket.on('receive move', function (inputSample, team, slime, inputNum) {
        var newInputIndex = serverSide.clients[0].queuedClientInput.length;
        serverSide.queuedClientInput[newInputIndex] = {input: inputSample, team: team, slime: slime, inputNum: inputNum};
    });

    var packageState = function(){
        var state = {};
        state.balls = [];
        //velocity and acc etc may need to be packaged to
        for(var i=0;i<balls.length;i++){
            var ball = {x: balls[i].x, y: balls[i].y};
            state.balls[i] = ball;
        }
        state.teams = [];
        for(var i=0;i<teams.length;i++){
            //score etc
        }
    };

    var serverUpdate = function(){
        var inputs = serverSide.clients[0].queuedClientInput;
        lastProcessedInput = inputs[i].inputNum;
        var lastProcessedInput;
        for(var i=0;i<inputs.length; i++){
            teams[team].slimes[slime].move(inputs[i]);
            lastProcessedInput = inputs[i].inputNum;
        }
        if(goalScored){
            onGoalReset();
            goalScored = false;
        }
        socket.emit('send state', packageState(), lastProcessedInput);
    };

};