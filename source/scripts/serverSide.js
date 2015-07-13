/*jslint browserify: true, devel: true */
'use strict';

var mechanics = require('./mechanics.js');

var socket;
var queuedClientInput = [[],[]];//includes team and slime for each input
var averageLag = [[],[]];

var stateSendStamp = 0;
var stateSendFrequency = 50;//1 every 50ms

var serverStartTime;

var serverToClientAdditionalLag = 0;

var addSocketCallbacks = function(socket){
    socket.on('receive move', function (data) {
        queuedClientInput[data.team][data.slime] = data.inputSample;
    });
    socket.on('pong', function(data){
       receivePing(data);
    });
};

function showClock(){
    //time test
    console.log('game time date.now '+(Date.now()-serverStartTime));
    console.log('date.now() '+Date.now());
}

var update = function(){
    var inputHappened = false;
    for(var teamNum=0;teamNum<queuedClientInput.length; teamNum++){
        for(var slimeNum=0;slimeNum<queuedClientInput[teamNum].length;slimeNum++){
            var clientInputSample = queuedClientInput[teamNum][slimeNum];
            if(clientInputSample !== null){
                //todo: add rewind, so moveSlime takes place in past based on client latency
                mechanics.moveSlime(teamNum, slimeNum, clientInputSample);
                queuedClientInput[teamNum][slimeNum] = null;
                inputHappened = true;
            }
        }
    }
    var localInputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    if(localInputSample !== null) {
        inputHappened = true;
        mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, localInputSample);
    }
    mechanics.localUpdate(socket.playerInfo);
    stateSendStamp += mechanics.timeStep();
    if(stateSendStamp > stateSendFrequency && inputHappened){
        stateSendStamp %= stateSendFrequency;
        var packagedState = mechanics.packageState();
        var inputTime = Date.now();
        setTimeout(function(){
            socket.emit('send state', {state: packagedState, timeStamp: inputTime});
        }, serverToClientAdditionalLag);
    }
};

var packetTimes = [];
var numPackets = 10;

function sendPings(teamNum, slimeNum){
    var interval = 200;
    if(packetTimes[teamNum] == null) {
        packetTimes[teamNum] = [];
    }
    packetTimes[teamNum][slimeNum] = [];
    for(var i=0; i<numPackets; i++){
        (function(){
            setTimeout(function(){
                socket.emit('ping', {teamNum: teamNum, slimeNum: slimeNum, start: Date.now()});
            }, interval);
        })();
    }
}

function receivePing(data){
    var pingData = {};
    pingData.start = data.start;
    pingData.end = Date.now();
    pingData.lag = (pingData.end-pingData.start)/2;
    console.log('indi lag '+pingData.lag);
    var pingsForClient = packetTimes[data.teamNum][data.slimeNum];
    pingsForClient.push(pingData.lag);
    if(pingsForClient.length == numPackets){
        var lag = calculateLag(pingsForClient) + serverToClientAdditionalLag;
        averageLag[data.teamNum][data.slimeNum] = lag ;
        socket.emit('lagInfo', {serverStartTime: serverStartTime, serverCurTime: Date.now(), lag: lag, teamNum: data.teamNum, slimeNum: data.slimeNum});
        //set a time to recaculate?
        //or have client calculate when they drift (based on extrapolation corrections)

        //time test
        console.log('game time date.now '+(Date.now()-serverStartTime));
        console.log('date.now() '+Date.now());
    }
}

function calculateLag(packetTimes){
    /*var sum = 0;
    for(var packetTime of packetTimes){
        sum += packetTime.lag;
    }
    return sum/packetTimes.length;*/

    var sumFunction = (sum, currentValue) => sum+currentValue;

    function findStandardDeviation(){
        var mean = packetTimes.reduce(sumFunction, 0)/packetTimes.length;
        var sumElement = packetTimes.map((value)=>Math.pow(value - mean, 2));
        var variance = sumElement.reduce(sumFunction, 0)/packetTimes.length;
        return Math.sqrt(variance);
    }
    packetTimes.sort((a,b) => a > b);
    var medianId = Math.floor(packetTimes.length/2);
    var medianLag = packetTimes[medianId];
    var standardDeviation = findStandardDeviation(packetTimes);
    var filteredTimes = packetTimes.filter((value) => Math.abs(value-medianLag) < standardDeviation);
    return filteredTimes.reduce(sumFunction, 0)/packetTimes.length;
}

module.exports = {
    registerSocket: function(socketRef){
        socket = socketRef;
        addSocketCallbacks(socket);
    },
    startGame: function(){
        document.getElementById('pingTest').onclick = function () {
            sendPings(1, 0)
        };
        document.getElementById('showClock').onclick = showClock;
        mechanics.startGame(update);
        serverStartTime = Date.now();
    },
    sendPings: sendPings
};