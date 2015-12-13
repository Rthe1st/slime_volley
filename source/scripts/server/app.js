/*jslint node: true */
'use strict';

import express from 'express';
import http from 'http';
import path from 'path';
import serverMain from './serverMain.js';

let app = express();
let httpServer = http.Server(app);

var serverDir = '../../..'

app.use(express.static(path.join(__dirname, serverDir + '/public')));

app.get('/', function (req, res) {
    var options = {
        root: __dirname + serverDir + '/public/'
    };

    res.sendFile('html/game.html', options);
});

httpServer.listen(80, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);

    serverMain();

});

export function getHttpServer(){
	return httpServer;
}