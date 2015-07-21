/*jslint browserify: true, devel: true */
'use strict';

var mechanics = require('./mechanics.js');

var socket;

var clientInfo = {};

var rewindLimit = 100;//in ms, the maximum amount of lag rewind accommodates

var timeOfLastStateSend = 0;
var stateSendFrequency = 50;//1 every 50ms

var serverStartTime;

var serverToClientAdditionalLag = 0;

var storedStates = [];

var clientInfoKey = function (team, slime) {
    return team + ',' + slime;
};

var addSocketCallbacks = function (socket) {
    socket.on('receive move', function (data) {
        var client = clientInfo[clientInfoKey(data.team, data.slime)];
        var samplePack = {
            inputSample: data.inputSample,
            timeStamp: localToGameTime(Date.now() - client.lag)
        };
        client.newSamplePacks.push(samplePack);
    });
    socket.on('pong', function (data) {
        receivePing(data);
    });
    socket.on('real ping', function (data) {
        console.log('real ping '+(Date.now()-data.sendTime)/2);
    });
};

function showClock() {
    //time test
    console.log('game time date.now ' + localToGameTime(Date.now()));
    console.log('date.now() ' + Date.now());
}

function localToGameTime(localTimeStamp) {
    return localTimeStamp - serverStartTime;
}


//only here for dev testing, may help simplify for testing lag stuff
var notRewind = function () {
    var inputHappened = false;
    for (let clientKey of Object.keys(clientInfo)) {
        let client = clientInfo[clientKey];
        for (var newSamplePack of client.newSamplePacks) {
            mechanics.moveSlime(client.team, client.slime, newSamplePack.inputSample);
            inputHappened = true;
        }
        client.newSamplePacks = [];
    }
    return inputHappened;
};

var rewind = function () {
    var allClientsInputs = [];
    var oldestAllowedTimeStamp = localToGameTime(Date.now() - rewindLimit);
    for (let clientKey of Object.keys(clientInfo)) {
        let client = clientInfo[clientKey];
        for (var newSamplePack of client.newSamplePacks) {
            //if lag was too high to rewind, rewind as far back as possible
            //it may be better to just discard inputs this old?
            if (newSamplePack.timeStamp < oldestAllowedTimeStamp) {
                newSamplePack.timeStamp = oldestAllowedTimeStamp;
            }
            allClientsInputs.push({
                inputSample: newSamplePack.inputSample,
                timeStamp: newSamplePack.timeStamp,
                slime: client.slime,
                team: client.team
            });
        }
    }
    if (allClientsInputs.length > 0) {
        allClientsInputs.sort((a, b) => a.timeStamp - b.timeStamp);
        var rewindState;
        for (let stateIndex = storedStates.length - 1; stateIndex >= 0; stateIndex--) {
            if (localToGameTime(storedStates[stateIndex].timeStamp) < allClientsInputs[0].timeStamp) {
                rewindState = storedStates[stateIndex];
                console.log('rewind to client[0] time diff: '+(allClientsInputs[0].timeStamp-localToGameTime(rewindState.timeStamp)));
                mechanics.loadNewState(rewindState.state);
                storedStates.splice(stateIndex+1);
                break;
            }
        }
        for (let clientKey of Object.keys(clientInfo)) {
            let client = clientInfo[clientKey];
            client.samplePacks = client.samplePacks.filter((pack) => pack.timeStamp > localToGameTime(rewindState.timeStamp));
            for (var oldSamplePack of client.samplePacks) {
                allClientsInputs.push({
                    inputSample: oldSamplePack.inputSample,
                    timeStamp: oldSamplePack.timeStamp,
                    slime: client.slime,
                    team: client.team
                });
            }
            client.samplePacks = client.samplePacks.concat(client.newSamplePacks);
            client.newSamplePacks = [];
        }
        var saveFastForwardStates = function (state, gameTimeStamp) {
            storedStates.push({state: state, timeStamp: gameToServerTime(gameTimeStamp)});
        };
        mechanics.fastForward(localToGameTime(rewindState.timeStamp), allClientsInputs, localToGameTime, saveFastForwardStates);
    }
    return allClientsInputs.length > 0;
};

function gameToServerTime(gameTimeStamp) {
    return serverStartTime + gameTimeStamp;
}

var storeNewState = function (state, timeStamp) {
    storedStates.push({state: state, timeStamp: timeStamp});
    if (storedStates.length > 0 && timeStamp - storedStates[storedStates.length - 1].timeStamp > rewindLimit) {
        storedStates.shift();
    }
};

var toRewind = true;
var inputTime = Date.now();

var update = function () {
    var inputHappened = false;
    //note: because the server will always have some lag to clients
    //it could arguably make sense to run the server behind time by ~lowest lag
    //to lessen impact of rewinds
    if(toRewind){
        inputHappened = rewind();
    }else{
        inputHappened = notRewind();
    }
    var localInputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    var tooSoon = (Date.now() - inputTime) > 70;
    if (localInputSample !== null && tooSoon) {
        inputHappened = true;
        mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, localInputSample);
        var client = clientInfo[clientInfoKey(socket.playerInfo.team, socket.playerInfo.slime)];
        client.samplePacks.push({inputSample: localInputSample, timeStamp: Date.now()});
    }
    mechanics.localUpdate(socket.playerInfo);
    var packagedState = mechanics.packageState();
    storeNewState(packagedState, inputTime);
    if (inputHappened && tooSoon) {
        inputTime = Date.now();
        mechanics.packageState();
        timeOfLastStateSend = localToGameTime(Date.now());
        setTimeout(function () {
            console.log('sending state');
            socket.emit('send state', {state: packagedState, timeStamp: inputTime, sendTime: Date.now()});
        }, serverToClientAdditionalLag);
    }
};

var packetTimes = [];
var numPackets = 10;

function sendPings(teamNum, slimeNum) {
    var interval = 200;
    if (packetTimes[teamNum] == null) {
        packetTimes[teamNum] = [];
    }
    packetTimes[teamNum][slimeNum] = [];
    for (var i = 0; i < numPackets; i++) {
        (function () {
            setTimeout(function () {
                socket.emit('ping', {teamNum: teamNum, slimeNum: slimeNum, start: Date.now()});
            }, interval);
        })();
    }
}

function receivePing(data) {
    var pingData = {};
    pingData.start = data.start;
    pingData.end = Date.now();
    pingData.lag = (pingData.end - pingData.start) / 2;
    console.log('individual lag ' + pingData.lag);
    var pingsForClient = packetTimes[data.teamNum][data.slimeNum];
    pingsForClient.push(pingData.lag);
    if (pingsForClient.length == numPackets) {
        var lag = calculateLag(pingsForClient) + serverToClientAdditionalLag;
        clientInfo[clientInfoKey(data.teamNum, data.slimeNum)].lag = lag;
        var serverCurTime = Date.now();
        setTimeout(function () {
            socket.emit('lagInfo', {
                serverStartTime: serverStartTime,
                serverCurTime: serverCurTime,
                lag: lag,
                teamNum: data.teamNum,
                slimeNum: data.slimeNum
            });
        }, serverToClientAdditionalLag);
        //set a time to recalculate?
        //or have client calculate when they drift (based on extrapolation corrections)

        console.log('game time date.now ' + (Date.now() - serverStartTime));
        console.log('date.now() ' + Date.now());
    }
}

function calculateLag(packetTimes) {

    var sumFunction = (sum, currentValue) => sum + currentValue;

    function findStandardDeviation() {
        var mean = packetTimes.reduce(sumFunction, 0) / packetTimes.length;
        var sumElement = packetTimes.map((value)=>Math.pow(value - mean, 2));
        var variance = sumElement.reduce(sumFunction, 0) / packetTimes.length;
        return Math.sqrt(variance);
    }

    packetTimes.sort((a, b) => a - b);
    var medianId = Math.floor(packetTimes.length / 2);
    var medianLag = packetTimes[medianId];
    var standardDeviation = findStandardDeviation(packetTimes);
    var filteredTimes = packetTimes.filter((value) => Math.abs(value - medianLag) < standardDeviation);
    return filteredTimes.reduce(sumFunction, 0) / packetTimes.length;
}

module.exports = {
    registerSocket: function (socketRef) {
        socket = socketRef;
        var slime = socket.playerInfo.slime;
        var team = socket.playerInfo.team;
        clientInfo[clientInfoKey(team, slime)] = {
            newSamplePacks: [],
            samplePacks: [],
            lag: 0,
            slime: slime,
            team: team
        };
        addSocketCallbacks(socket);
    },
    startGame: function () {
        document.getElementById('pingTest').onclick = function () {
            sendPings(1, 0)
        };
        document.getElementById('showClock').onclick = showClock;
        mechanics.startGame(update);
        serverStartTime = Date.now();
        storeNewState(mechanics.packageState(), Date.now());
    },
    registerClient: function (slime, team) {
        clientInfo[clientInfoKey(team, slime)] = {
            newSamplePacks: [],
            samplePacks: [],
            lag: 0,
            slime: slime,
            team: team
        };
        sendPings(team, slime);
    }
};