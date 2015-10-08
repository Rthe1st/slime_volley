/*jslint browserify: true, devel: true*/
'use strict';

import {Mechanics, storeGUI} from './gamePlay/mechanics.js';
import GameClock from './GameClock.js';

import phaserWrapper from './libaryWrappers/phaserWrapper.js';

/*import * as phaserFramework from 'PhaserWrapper';

 var PhaserWrapper = phaserFramework.PhaserWrapper;*/

var socket;

var serverData;
var oldServerData;
var serverStateDirty = false;
var unackInputSamples = [];

var gameClock;
var mechanics;

var clientSettings = {toExtrapolate: false, useServerInputs: false, localSimulation: true};

export function loadGUI(gui) {
    var folder = gui.addFolder('Client settings');
    folder.add(clientSettings, 'toExtrapolate');
    folder.add(clientSettings, 'useServerInputs');
    folder.add(clientSettings, 'localSimulation');
    storeGUI(gui);
}

var addSocketCallbacks = function (socket) {
    socket.on('send state', function (data) {
        oldServerData = serverData;
        serverData = data;
        serverStateDirty = true;
        socket.emit('real ping', {sendTime: data.sendTime});
    });
    socket.on('sync response', function (data) {
        gameClock.syncReponse(data);
    });
};

export function unregisterSocket(socket) {
    socket.removeListener('send state');
}

var sendMove = function (samplePack) {
    GameClock.piggyBackSync(samplePack);
    socket.emit('send move', samplePack);
};

var update = function () {
    //observers never need to sample input
    if (!socket.isPlayer && serverStateDirty) {
        mechanics.loadNewState(serverData.state);
        serverStateDirty = false;
        return;
    }
    //before processing new input, check for new server state and re-run stored inputSamples
    //for client side extrapolation
    if (serverStateDirty) {
        mechanics.loadNewState(serverData.state);
        serverStateDirty = false;
        var allAcked = true;
        for (var i = 0; i < unackInputSamples.length; i++) {
            if (unackInputSamples[i].timeStamp > serverData.timeStamp) {
                unackInputSamples = unackInputSamples.slice(i);
                allAcked = false;
                break;
            }
        }
        if (allAcked) {
            unackInputSamples = [];
        }
        if (clientSettings.toExtrapolate) {
            var withServerInputs = unackInputSamples;
            if (clientSettings.useServerInputs) {
                withServerInputs.concat(serverData.inputSamples);
            }
            mechanics.fastForward(serverData.timeStamp, withServerInputs);
        }
    }
    //now process newest local inputs
    var inputSample = mechanics.sampleInput(socket.playerInfo.team, socket.playerInfo.slime);
    if (inputSample !== null) {
        var samplePack = {
            inputSample: inputSample,
            timeStamp: gameClock.now(),
            slime: socket.playerInfo.slime,
            team: socket.playerInfo.team
        };
        unackInputSamples.push(samplePack);
        sendMove({inputSample: samplePack.inputSample, timeStamp: samplePack.timeStamp});
        if(clientSettings.localSimulation) {
            mechanics.moveSlime(socket.playerInfo.team, socket.playerInfo.slime, inputSample);
        }
    }
    if(clientSettings.localSimulation) {
        mechanics.localUpdate(socket.playerInfo);
    }
};

export function registerSocket(socketRef) {
    socket = socketRef;
    addSocketCallbacks(socket);
}
export function startGame() {
    gameClock = new GameClock();
    document.getElementById('showClock').onclick = gameClock.showClock.bind(gameClock);
    document.getElementById('pingTest').onclick = function () {
        GameClock.manualSync(socket, true);
    };
    mechanics = new Mechanics(phaserWrapper, gameClock.now.bind(gameClock), true, true);
    GameClock.manualSync(socket);
    mechanics.startGame(update);
}