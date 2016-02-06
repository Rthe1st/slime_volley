import express from 'express';
import http from 'http';
import path from 'path';

let app = express();
let httpServer = http.Server(app);

var serverDir = '../..';

app.use(express.static(path.join(__dirname, serverDir + '/public')));

httpServer.listen(80, function () {

    var host = httpServer.address().address;
    var port = httpServer.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
