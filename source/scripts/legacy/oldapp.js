/*jslint node: true */
'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

require("babel/register");

var serverSide = require('./serverSide.js');

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

    serverSide.startGame(io);

});

io.on('connection', function (socket) {
    serverSide.clientConnection(socket);
});