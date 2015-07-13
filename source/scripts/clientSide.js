/*jslint browserify: true, devel: true*/
'use strict';

var mechanics = require('./mechanics.js');

var socket;

var serverData;
var oldServerData;
var serverStateDirty = false;
var unackInputSamples = [];

//before lag is computed, assume best possible
//synced clocks and no lag
var localTimeWhenServerStart;
var lagToServer;
var serverStartTime;

function showClock(){
    //time test
    console.log('game time date.now '+localToGameTime(Date.now()));
    console.log('date.now() '+Date.now());
}


var addSocketCallbacks = function(socket){
    socket.on('receive state', function (data) {
        oldServerData = serverData;
        serverData = data;
        serverStateDirty = true;
    });

    socket.on('ping', function(data){
        socket.emit('pong', data);
    });

    socket.on('lagInfo', function(data){
        //do some console logs to make sure game time is the same on both ends
        lagToServer = data.lag;
        serverStartTime = data.serverStartTime;
        var timeOffset = Date.now() - lagToServer - data.serverCurTime;
        localTimeWhenServerStart = data.serverStartTime + timeOffset;

        console.log('game time date.now '+localToGameTime(Date.now()));
        console.log('date.now() '+Date.now());
        console.log('lag to server '+lagToServer);
        console.log('serverstarttime '+serverStartTime);
        console.log('localtimewheserverstart '+localTimeWhenServerStart);
    });
};

function serverToGameTime(serverTimeStamp){
    return serverTimeStamp - serverStartTime;
}

function localToGameTime(localTimeStamp){
    return localTimeStamp - localTimeWhenServerStart;
}

var unregisterSocket = function(socket){
    socket.removeListener('receive state');
};

var sendMove = function(inputSample){
    socket.emit('send move', inputSample);
};

var extrapolate = function(){
    var inputElement = 0;
    var simulatedTime = 0;
    var serverTimeConverted = serverToGameTime(serverData.timeStamp);
    console.log('time to make up in seconds: '+ (localToGameTime(Date.now()) - serverTimeConverted)/1000);
    while(serverTimeConverted + simulatedTime < localToGameTime(Date.now())){
        simulatedTime += mechanics.timeStep();
        var timeToMakeUp = localToGameTime(Date.now()) - (serverTimeConverted + simulatedTime);
        //extrapolating more then 100 steps is crazy, just give up (100*1/60=1.6seconds)
        if(timeToMakeUp > mechanics.timeStep()*100){
            break;
        }
        if(inputElement < unackInputSamples.length && serverTimeConverted + simulatedTime > unackInputSamples[inputElement].timeStamp){
            var inputToUse = unackInputSamples[inputElement];
            inputElement++;
            mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, inputToUse.inputSample);
            mechanics.localUpdate(socket.playerInfo);
        }
        mechanics.manualUpdateHack();
    }
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
        for(var i=0;i<unackInputSamples.length;i++){
            if(localToGameTime(unackInputSamples[i].timeStamp) > serverToGameTime(serverData.timeStamp)){
                unackInputSamples = unackInputSamples.slice(i);
                break;
            }
        }
        extrapolate();
    }
    //now process newest local inputs
    var inputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    if(inputSample !== null){
        var samplePack = {inputSample: inputSample, timeStamp: localToGameTime(Date.now())};
        unackInputSamples.push(samplePack);
        //server cant trust our timestamp, don't bother sending
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
        document.getElementById('showClock').onclick = showClock;
        mechanics.startGame(update);
        //at this point we havnt established how much lag there is
        //so assume best case, no lag and we started when the server did
        //(really server should announce serverstart time (and lag) when it allows us to register)
        localTimeWhenServerStart = Date.now();
        lagToServer = 0;
        serverStartTime = Date.now();
    }
};