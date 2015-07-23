/*jslint node: true */
'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var messageTypes = {
    playerSet: 'set player',
    playerJoined: 'player joined',
    playerLeft: 'player left',
    observerSet: 'observer set'
};

console.log(messageTypes);

var sendMoveCount = 0;
var sendStateCount = 0;

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', function (req, res) {
    var options = {
        root: __dirname + '/../public/'
    };

    res.sendFile('html/game.html', options);
});

var server = http.listen(80, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);

});

//literaly 0 idea if this is the "socket.io way" to reference a socket
var playerSockets = [];
var numTeams = 2;
var teamSize = 1;
var teams = [];
for (var i = 0; i < numTeams; i++) {
    teams[i] = {};
    teams[i].freeSlimes = [];
    for (var slime = 0; slime < teamSize; slime++) {
        teams[i].freeSlimes[slime] = slime;
    }
    teams[i].assignedSlimes = {};
}
var assignSlime = function (socket) {
    socket.auth = playerSockets.length === 0;
    playerSockets.push(socket);
    for (var i = 0; i < teams.length; i++) {
        if (teams[i].freeSlimes.length > 0) {
            socket.team = i;
            socket.slime = teams[i].freeSlimes.pop();
            teams[socket.team].assignedSlimes[socket.slime] = socket;
            break;
        }
    }
};
var removeSlime = function (socket) {
    //looping is lame, but sockets being removed at any index makes solution tricky
    for (var i = 0; i < playerSockets.length; i++) {
        if (playerSockets[i].team === socket.team && playerSockets[i].slime === socket.slime) {
            playerSockets.splice(i, 1);
            break;
        }
    }
    delete teams[socket.team].assignedSlimes[socket.slime];
    teams[socket.team].freeSlimes.push(socket.slime);
};
var observerSockets = [];

var playerMessage = function (socket, reason, broadcast) {
    var payload = {
        team: socket.team,
        slime: socket.slime,
        numUsers: playerSockets.length,
        auth: socket.auth
    };
    if (broadcast) {
        socket.broadcast.emit(reason, payload);
    } else {
        socket.emit(reason, payload);
    }
};

var setPlayer = function (socket) {
    console.log('adding new player');
    socket.type = 'player';
    assignSlime(socket);
    playerMessage(socket, messageTypes.playerSet, false);
    playerMessage(socket, messageTypes.playerJoined, true);
};

var processConnection = function (socket) {
    //add users as they connected
    //first 2 are players, rest observers
    //player 1 is authoritative
    console.log('a user connected');
    if (playerSockets.length >= numTeams * teamSize) {
        console.log('players full, adding observer');
        socket.type = 'observer';
        socket.emit(messageTypes.observerSet);
        socket.observerNum = observerSockets.length;
        observerSockets[observerSockets.length] = socket;
    } else {
        setPlayer(socket);
    }
};

var setAuthoritative = function (socket) {
    socket.emit('set auth');
};


io.on('connection', function (socket) {
    processConnection(socket);

    //check how to replace anonomous function with named but prevent immediate execution
    socket.on('disconnect', function () {
        //if player 1 leaves, authority passes to the observer replacing them
        if (socket.type === 'player') {
            playerMessage(socket, messageTypes.playerLeft, true);
            removeSlime(socket);
            if (observerSockets.length > 0) {
                setPlayer(observerSockets.pop());
            }
            if (socket.auth && playerSockets.length > 0) {
                setAuthoritative(playerSockets[0]);
            }
        } else {
            observerSockets.splice(socket.observerNum, 1);
        }
        console.log('user disconnected');
    });

    socket.on('send move', function (data) {
        if (socket.type === 'player') {
            console.log('send move called' + sendMoveCount);
            sendMoveCount++;
            data.team = socket.team;
            data.slime = socket.slime;
            playerSockets[0].emit('receive move', data);
        }
    });

    socket.on('send state', function (data) {
        console.log('send state called ' + sendStateCount);
        sendStateCount++;
        socket.broadcast.emit('receive state', data);
        //look up how rooms work, use here
        for (var o = 0; o < observerSockets.length; o++) {
            socket.broadcast.emit('receive state', data);
        }
    });

    socket.on('real ping', function (data) {
        console.log('real ping happened');
        playerSockets[0].emit('real ping', data);
    });

    socket.on('manual sync', function(data){
        data.team = socket.team;
        data.slime = socket.slime;
        playerSockets[0].emit('manual sync', data);
    });

    socket.on('sync response', function (data) {
        console.log('sync happened');
        teams[data.teamNum].assignedSlimes[data.slimeNum].emit('sync response', data);
    });
});