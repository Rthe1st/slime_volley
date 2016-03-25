import express from 'express';
import http from 'http';
import path from 'path';

import startGame from './serverMain.js';

let app = express();

var serverDir = '/srv/slime_volley/public';
app.use(express.static(serverDir));

let httpServer = http.Server(app);

httpServer.listen(80, function () {

    var host = httpServer.address().address;
    var port = httpServer.address().port;

    console.log('App listening at http://%s:%s', host, port);

    startGame();
});
