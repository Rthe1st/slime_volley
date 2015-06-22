var express = require('express');
var app = express();

app.get('/game.html', function (req, res) {
  var options = {
    root: __dirname + '/../public/'
  };
  
  res.sendFile('html/game.html', options);
});

var server = app.listen(80, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});