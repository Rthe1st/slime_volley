/*jslint browserify: true, devel: true */
'use strict';

var mechanics = require('./mechanics.js');

var gameClock = require('./gameClock.js');

var socket;

var clientInfo = {};

var serverSettings = {
    rewindLimit: 100,
    toRewind: false,
    stateSendFrequency: 50,
    serverToClientAdditionalLag: 0,
    sendState: true,
    sendInputs: false
};

var timeOfLastStateSend = 0;

var storedStates = [];

var loadGUI = function (gui) {
    var folder = gui.addFolder('Server settings');
    folder.add(serverSettings, 'rewindLimit');
    folder.add(serverSettings, 'toRewind');
    folder.add(serverSettings, 'stateSendFrequency');
    folder.add(serverSettings, 'serverToClientAdditionalLag');
    folder.add(serverSettings, 'sendState');
    folder.add(serverSettings, 'sendInputs');
    mechanics.storeGui(gui);
};

var clientInfoKey = function (team, slime) {
    return team + ',' + slime;
};

var addSocketCallbacks = function (socket) {
    socket.on('receive move', function (data) {
        setTimeout(function () {
            socket.emit('sync response', {
                serverStartTime: gameClock.startTime(),
                sentFromServerTime: Date.now(),
                sentFromClientTime: data.sentFromClientTime,
                wastedTime: 0,
                teamNum: data.team,
                slimeNum: data.slime
            });
            var client = clientInfo[clientInfoKey(data.team, data.slime)];
            var samplePack = {
                inputSample: data.inputSample,
                timeStamp: data.timeStamp
            };
            //trusting client timestamp is a little dodgy
            //but they can t fake increased lag anyway, up to rewind limit
            //the cheat is worse the more fakeLag - actualLag
            //this makes cheating easier by allowing that difference to be rewindlimit
            //where as before it would of only been limited by the real lag
            if (samplePack.timeStamp > gameClock.now()) {
                samplePack.timeStamp = gameClock.now();
            }
            client.newSamplePacks.push(samplePack);
        }, serverSettings.serverToClientAdditionalLag);
    });
    socket.on('real ping', function (data) {
        console.log('real ping on send state ' + (Date.now() - data.sendTime));
    });

    socket.on('manual sync', function (data) {
        setTimeout(function () {
            socket.emit('sync response', {
                serverStartTime: gameClock.startTime(),
                sentFromServerTime: Date.now(),
                sentFromClientTime: data.sentFromClientTime,
                wastedTime: 0,
                teamNum: data.team,
                slimeNum: data.slime
            });
        }, serverSettings.serverToClientAdditionalLag);
    });
};

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

var sampleTypes = Object.freeze({newPacks: 'newSamplePacks', oldPacks: 'samplePacks'});

var gatherSamplePacks = function (sampleType, mutate, excludedKeys, rewindState) {
    var allClientsInputs = [];
    for (let clientKey of Object.keys(clientInfo)) {
        if (excludedKeys[clientKey]) {
            next();
        }
        let client = clientInfo[clientKey];
        if (sampleType === sampleTypes.oldPacks && mutate) {
            client.samplePacks = client.samplePacks.filter((pack) => pack.timeStamp > rewindState.timeStamp);
        }
        for (var samplePack of client[sampleType]) {
            if (sampleType === sampleTypes.newPacks && mutate) {
                if(rewindState == 'undefined'){
                    console.log('excuse for breakpint');
                }
                samplePack.timeStamp = Math.max(samplePack.timeStamp, rewindState.timeStamp);
            }
            allClientsInputs.push({
                inputSample: samplePack.inputSample,
                timeStamp: samplePack.timeStamp,
                slime: client.slime,
                team: client.team
            });
        }
        if (sampleType === sampleTypes.oldPacks && mutate) {
            client.samplePacks = client.samplePacks.concat(client.newSamplePacks);
            client.newSamplePacks = [];
        }
    }
    return allClientsInputs;
};

var rewind = function () {
    storedStates = storedStates.filter((state) => state.timeStamp > gameClock.now() - serverSettings.rewindLimit);
    storedStates.sort((a,b) => a.timeStamp - b.timeStamp);//safeside
    var rewindState = storedStates[0];
    var allClientsInputs = gatherSamplePacks(sampleTypes.newPacks, true, {}, rewindState);
    if (allClientsInputs.length > 0) {
        mechanics.loadNewState(rewindState.state);
        allClientsInputs.concat(gatherSamplePacks(sampleTypes.oldPacks, true, {}, rewindState));
        var saveFastForwardStates = function (state, gameTimeStamp) {
            storedStates.push({state: state, timeStamp: gameTimeStamp});
        };
        mechanics.fastForward(rewindState.timeStamp, allClientsInputs, saveFastForwardStates);
    }
    return allClientsInputs.length > 0;
};

var storeNewState = function (state, timeStamp) {
    storedStates.push({state: state, timeStamp: timeStamp});
};

var update = function () {
    var inputHappened = false;
    //note: because the server will always have some lag to clients
    //it could arguably make sense to run the server behind time by ~lowest lag
    //to lessen impact of rewinds
    if (serverSettings.toRewind) {
        inputHappened = rewind();
    } else {
        inputHappened = notRewind();
    }
    var localInputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    if (localInputSample !== null) {
        inputHappened = true;
        mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, localInputSample);
        var client = clientInfo[clientInfoKey(socket.playerInfo.team, socket.playerInfo.slime)];
        client.samplePacks.push({inputSample: localInputSample, timeStamp: gameClock.now()});
    }
    var inputTime = gameClock.now();
    mechanics.localUpdate(socket.playerInfo);
    var packagedState = mechanics.packageState();
    storeNewState(packagedState, inputTime);
    //send state needs to be per client (as does input happened)
    if(serverSettings.sendInputs){
        //hack for only 2 players (where one is server)
        inputHappened = localInputSample;
    }
    if(inputHappened && serverSettings.sendState) {
        timeOfLastStateSend = gameClock.now();
        var sendState;
        //temp hack for 1 client
        //need to loop through and do for all players individually
        var statePacket;
        if(serverSettings.sendInputs){
            statePacket = {};
            statePacket.state = storedStates[0].state;
            statePacket.timeStamp = storedStates[0].timeStamp;
            var excludedKeys = {};
            excludedKeys[clientInfoKey(0, 1)] = true;
            statePacket.inputsToClient = gatherSamplePacks(sampleTypes.newPacks, false, excludedKeys, sendState);
            statePacket.inputsToClient.concat(gatherSamplePacks(sampleTypes.oldPacks, false, excludedKeys, sendState));
        }else{
            statePacket = {
                state: packagedState,
                timeStamp: gameClock.now(),
                sendTime: Date.now()
            }
        }
        setTimeout(function () {
            console.log('sending state');
            statePacket.sendTime = Date.now();
            socket.emit('send state', statePacket);
        }, serverSettings.serverToClientAdditionalLag);
    }
};

module.exports = {
    registerSocket: function (socketRef) {
        socket = socketRef;
        var slime = socket.playerInfo.slime;
        var team = socket.playerInfo.team;
        clientInfo[clientInfoKey(team, slime)] = {
            newSamplePacks: [],
            samplePacks: [],
            slime: slime,
            team: team
        };
        addSocketCallbacks(socket);
    },
    startGame: function () {
        document.getElementById('showClock').onclick = gameClock.showClock;
        mechanics.startGame(update);
        gameClock.setUp(Date.now());
        storeNewState(mechanics.packageState(), gameClock.now());
    },
    registerClient: function (slime, team) {
        clientInfo[clientInfoKey(team, slime)] = {
            newSamplePacks: [],
            samplePacks: [],
            slime: slime,
            team: team
        };
    },
    loadGUI: loadGUI
};