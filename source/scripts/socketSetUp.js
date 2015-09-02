/*jslint browser: true, browserify: true, devel: true*/
/* global io*/
'use strict';

var socket = io.connect();

import * as dat from 'dat-gui';

import * as clientSide from './clientSide.js';

var messageTypes = {playerSet: 'set player', playerJoined: 'player joined', playerLeft: 'player left', observerSet: 'observer set'};

socket.on(messageTypes.observerSet, function () {
    console.log('players full, you\'ve been placed in the observer queue');
    socket.isPlayer = false;
    clientSide.registerSocket(socket);
    clientSide.startGame();
});

socket.on(messageTypes.playerSet, function (data) {
    socket.isPlayer =  true;
    socket.playerInfo = {
        team: data.team,
        slime: data.slime
    };
    console.log('you\'ve joined as a player');
    clientSide.registerSocket(socket);
    clientSide.startGame();
    var gui = new dat.GUI();
    clientSide.loadGUI(gui);
});

socket.on(messageTypes.playerJoined, function (data) {
    console.log('new player joined');
});
socket.on(messageTypes.playerLeft, function () {
    console.log('player left');
});