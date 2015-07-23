/*jslint browserify: true, devel: true */
'use strict';

var mechanics = require('./mechanics.js');

var gameClock = require('./gameClock.js');

var socket;

var clientInfo = {};

var serverSettings = {rewindLimit: 100, toRewind: true, stateSendFrequency: 50, serverToClientAdditionalLag: 0, sendState: true};

var timeOfLastStateSend = 0;

var storedStates = [];

var loadGUI = function (gui) {
    var folder = gui.addFolder('Server settings');
    folder.add(serverSettings, 'rewindLimit');
    folder.add(serverSettings, 'toRewind');
    folder.add(serverSettings, 'stateSendFrequency');
    folder.add(serverSettings, 'serverToClientAdditionalLag');
    folder.add(serverSettings, 'sendState');
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

var rewind = function () {
    var allClientsInputs = [];
    for (let clientKey of Object.keys(clientInfo)) {
        let client = clientInfo[clientKey];
        for (var newSamplePack of client.newSamplePacks) {
            if (newSamplePack.timeStamp < gameClock.now() - serverSettings.rewindLimit) {
                //if lag was too high to rewind, rewind as far back as possible
                //it may be better to just discard inputs this old?
                newSamplePack.timeStamp = gameClock.now() - serverSettings.rewindLimit;
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
            if (storedStates[stateIndex].timeStamp < allClientsInputs[0].timeStamp) {
                rewindState = storedStates[stateIndex];
                mechanics.loadNewState(rewindState.state);
                storedStates.splice(stateIndex + 1);
                break;
            }
        }
        storedStates = storedStates.filter((state) => state.timeStamp > gameClock.now()-serverSettings.rewindLimit);
        for (let clientKey of Object.keys(clientInfo)) {
            let client = clientInfo[clientKey];
            client.samplePacks = client.samplePacks.filter((pack) => pack.timeStamp > rewindState.timeStamp);
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
    if (inputHappened && serverSettings.sendState) {
        mechanics.packageState();
        timeOfLastStateSend = gameClock.now();
        setTimeout(function () {
            console.log('sending state');
            socket.emit('send state', {state: packagedState, timeStamp: inputTime, sendTime: Date.now()});
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