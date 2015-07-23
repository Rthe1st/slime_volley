/*jslint browser: true, browserify: true, devel: true*/
/* global Phaser, io*/
'use strict';

var socket = io.connect();

var dat = require('dat-gui');

var clientSide = require('./clientSide.js');
var serverSide = require('./serverSide.js');

var gameNetwork;

var messageTypes = {playerSet: 'set player', playerJoined: 'player joined', playerLeft: 'player left', observerSet: 'observer set'};

socket.on(messageTypes.observerSet, function () {
    console.log('players full, you\'ve been placed in the observer queue');
    socket.isPlayer = false;
    gameNetwork = clientSide;
    gameNetwork.registerSocket(socket);
    gameNetwork.startGame();
});

socket.on('set auth', function(){
    gameNetwork.unregisterSocket(socket);
    gameNetwork = serverSide;
    gameNetwork.registerSocket(socket);
});

socket.on(messageTypes.playerSet, function (data) {
    socket.isPlayer =  true;
    socket.playerInfo = {
        team: data.team,
        slime: data.slime
    };
    socket.auth = data.auth;
    console.log('you\'ve joined as a player, auth: '+socket.auth);
    if(socket.auth){
        gameNetwork = serverSide;
    }else{
        gameNetwork = clientSide;
    }
    gameNetwork.registerSocket(socket);
    gameNetwork.startGame();
    var gui = new dat.GUI();
    gameNetwork.loadGUI(gui);
});

socket.on(messageTypes.playerJoined, function (data) {
    console.log('new player joined');
    if(socket.auth) {
        gameNetwork.registerClient(data.slime, data.team);
    }
});
socket.on(messageTypes.playerLeft, function () {
    console.log('player left');
});