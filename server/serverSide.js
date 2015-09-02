/*jslint browserify: true, devel: true */
'use strict';

import hackedPhaser from 'hackedPhaser';

import SocketTeams from './SocketTeams.js';

import {Mechanics, storeGUI} from './../source/scripts/gamePlay/mechanics.js';
import GameClock from './../source/scripts/GameClock.js';

let io;
let socketTeams;

var serverSettings = {
    rewindLimit: 100,
    toRewind: false,
    stateSendFrequency: 50,
    serverToClientAdditionalLag: 0,
    sendState: true,
    sendInputs: false
};

var gameClock;
var mechanics;

var timeOfLastStateSend = 0;

var storedStates = [];

/*
 //this needs to be moved clientside and sent into server
 export function loadGUI(gui) {
 var folder = gui.addFolder('Server settings');
 folder.add(serverSettings, 'rewindLimit');
 folder.add(serverSettings, 'toRewind');
 folder.add(serverSettings, 'stateSendFrequency');
 folder.add(serverSettings, 'serverToClientAdditionalLag');
 folder.add(serverSettings, 'sendState');
 folder.add(serverSettings, 'sendInputs');
 storeGUI(gui);
 }*/

var addSocketCallbacks = function (socket) {
    socket.on('send move', function (data) {
        setTimeout(function () {
            socket.emit('sync response', {
                serverStartTime: gameClock.startTime(),
                sentFromServerTime: Date.now(),
                sentFromClientTime: data.sentFromClientTime,
                wastedTime: 0
            });
            var samplePack = {
                inputSample: data.inputSample,
                timeStamp: data.timeStamp
            };
            //trusting client timestamp is a little dodgy
            //but they can fake increased lag anyway, up to rewind limit
            //the cheat is worse the greater (fakeLag - actualLag) is
            //this makes cheating easier by allowing that difference as large as rewindlimit
            //because they can pretend real lag is 0
            if (samplePack.timeStamp > gameClock.now()) {
                samplePack.timeStamp = gameClock.now();
            }
            socket.newSamplePacks.push(samplePack);
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
                wastedTime: 0
            });
        }, serverSettings.serverToClientAdditionalLag);
    });
};

//only here for dev testing, may help simplify for testing lag stuff
var notRewind = function () {
    var inputHappened;
    for (let team of socketTeams.teams) {
        for (let socket of team.assignedSlimes) {
            for (var newSamplePack of socket.newSamplePacks) {
                mechanics.moveSlime(socket.team, socket.slime, newSamplePack.inputSample);
                inputHappened = true;
            }
            socket.newSamplePacks = [];
        }
    }
    return inputHappened;
};

var sampleTypes = Object.freeze({newPacks: 'newSamplePacks', oldPacks: 'samplePacks'});

var gatherSamplePacks = function (sampleType, mutate, excludedKey, rewindState) {
    var allClientsInputs = [];
    for (let team of socketTeams.teams) {
        for (let socket of team.assignedSlimes) {
            if (excludedKey === socket) {
                next();
            }
            if (sampleType === sampleTypes.oldPacks && mutate) {
                socket.samplePacks = socket.samplePacks.filter((pack) => pack.timeStamp > rewindState.timeStamp);
            }
            for (var samplePack of socket[sampleType]) {
                if (sampleType === sampleTypes.newPacks && mutate) {
                    if (rewindState == 'undefined') {
                        console.log('excuse for breakpint');
                    }
                    samplePack.timeStamp = Math.max(samplePack.timeStamp, rewindState.timeStamp);
                }
                allClientsInputs.push({
                    inputSample: samplePack.inputSample,
                    timeStamp: samplePack.timeStamp,
                    slime: socket.slime,
                    team: socket.team
                });
            }
            if (sampleType === sampleTypes.oldPacks && mutate) {
                socket.samplePacks = socket.samplePacks.concat(socket.newSamplePacks);
                socket.newSamplePacks = [];
            }
        }
    }
    return allClientsInputs;
};

var rewind = function () {
    storedStates = storedStates.filter((state) => state.timeStamp > gameClock.now() - serverSettings.rewindLimit);
    storedStates.sort((a, b) => a.timeStamp - b.timeStamp);
    var rewindState = storedStates[0];
    var allClientsInputs = gatherSamplePacks(sampleTypes.newPacks, true, {}, rewindState);
    if (allClientsInputs.length > 0) {
        mechanics.loadNewState(rewindState.state);
        allClientsInputs.concat(gatherSamplePacks(sampleTypes.oldPacks, true, null, rewindState));
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
    var inputTime = gameClock.now();
    mechanics.localUpdate(socket.playerInfo);
    var packagedState = mechanics.packageState();
    storeNewState(packagedState, inputTime);
    //inputHappened could be per client (as does input happened)
    if (inputHappened && serverSettings.sendState) {
        timeOfLastStateSend = gameClock.now();
        //temp hack for 1 client
        //need to loop through and do for all players individually
        //(because they may of all receives differet updates thus far?
        var sendState = storedStates[0];
        let statePacket = {};
        if (serverSettings.sendInputs) {
            statePacket.state = sendState.state;
            statePacket.timeStamp = sendState.timeStamp;
        } else {
            statePacket.state = packagedState;
            statePacket.timeStamp = gameClock.now();
        }
        setTimeout(function () {
            console.log('sending state');
            statePacket.sendTime = Date.now();
            if(serverSettings.sendInputs){
                for (let team of socketTeams.teams) {
                    for (let socket of team.assignedSlimes) {
                        var excludedKey = socket;
                        statePacket.inputsToClient = gatherSamplePacks(sampleTypes.newPacks, false, excludedKey, sendState);
                        statePacket.inputsToClient.concat(gatherSamplePacks(sampleTypes.oldPacks, false, excludedKey, sendState));
                        socket.emit('send state', statePacket);
                    }
                    let toObserverPacks = gatherSamplePacks(sampleTypes.newPacks, false, null, sendState);
                    toObserverPacks.concat(gatherSamplePacks(sampleTypes.oldPacks, false, null, sendState));
                    for (let socket of team.observerSockets) {
                        socket.emit('send state', statePacket);
                    }
                }
            }else{
                io.sockets.emit('send state', statePacket);
            }
        }, serverSettings.serverToClientAdditionalLag);
    }
};

export function startGame(tIo) {
    io = tIo;
    socketTeams = new SocketTeams();
    gameClock = new GameClock(Date.now());
    document.getElementById('showClock').onclick = gameClock.showClock.bind(gameClock);
    mechanics = new Mechanics(hackerPhaser, gameClock.now.bind(gameClock), false);
    let postCreate = function () {
        storeNewState(mechanics.packageState(), gameClock.now());
    };
    mechanics.startGame(update, postCreate);
}

export function clientConnection(socket) {
    socketTeams.processConnection(socket);
    addSocketCallbacks(socket);
}