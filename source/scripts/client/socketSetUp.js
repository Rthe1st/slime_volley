/*jslint browser: true, browserify: true, devel: true*/
/* global io*/
'use strict';

import * as dat from 'dat-gui';

import * as clientSide from './clientSide.js';

import messageTypes from './MessageTypes.js';

function addSocketCallbacks(socket) {
    socket.on('send state', function (data) {
        oldServerData = serverData;
        serverData = data;
        serverStateDirty = true;
        socket.emit('real ping', {sendTime: data.sendTime});
    });
    socket.on('sync response', function (data) {
        gameClock.syncReponse(data);
    });
}

function unregisterSocket(socket) {
    socket.removeListener('send state');
    socket.removeListener('sync reponse');
}

function sendMove(samplePack) {
    GameClock.piggyBackSync(samplePack);
    socket.emit('send move', samplePack);
}

clientSide.startGame();

/*var socket = io.connect();

socket.on(messageTypes.observerSet, function () {
    console.log('players full, you\'ve been placed in the observer queue');
    socket.isPlayer = false;
    addSocketCallbacks(socket);
    clientSide.startGame();
});

socket.on(messageTypes.playerSet, function (data) {
    socket.isPlayer =  true;
    socket.playerInfo = {
        team: data.team,
        slime: data.slime
    };
    console.log('you\'ve joined as a player');
    addSocketCallbacks(socket);
    clientSide.startGame();
    var gui = new dat.GUI();
    clientSide.loadGUI(gui);
});

socket.on(messageTypes.playerJoined, function (data) {
    console.log('new player joined');
});
socket.on(messageTypes.playerLeft, function () {
    console.log('player left');
});*/