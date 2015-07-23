/*jslint browserify: true, devel: true*/
'use strict';

var localStartTime;

var serverStartTime;
var bestPing = null;

//wastedTime could be how long before the server got round to repeating the message
var clientSideSync = function (sentFromServerTime, sentFromClientTime, wastedTime, tServerStartTime) {
    serverStartTime = tServerStartTime;
    var pingTime = (Date.now() - sentFromClientTime) / 2 - wastedTime;
    if (pingTime < bestPing || bestPing === null) {
        console.log('best ping ' + bestPing);
        console.log('new ping' + pingTime);
        bestPing = pingTime;
        var timeOffset = Date.now() - sentFromServerTime;
        localStartTime = serverStartTime + timeOffset - pingTime;
    }
};


//decided to trust client side lag measurement
//they can increase it arbitarilty anyway
//as long as I check lag is positive, at most client can cancel effects of rewind
//by giving a shorter lag then is true

module.exports = {
    startTime: function () {
        return serverStartTime;
    },
    now: function () {
        return Date.now() - localStartTime;
    },
    toGameTime: function (timeStamp) {
        return timeStamp - localStartTime;
    },
    setUp: function (tServerStartTime) {
        //for client, use this a s a first guess, but then correct with piggybacksync
        localStartTime = serverStartTime = tServerStartTime || Date.now();
    },
    manualSync: function (socket) {
        socket.emit('manual sync', {sentFromClientTime: Date.now()});
    },
    piggyBackSync: function (data) {
        //technically, if data.curGameTime exists, it could be used instead
        //saving on packet size a wee bit
        data.sentFromClientTime = Date.now();
    },
    syncReponse: function (data) {
        //this could try to piggy back on serversend state, by accounting for wasted time
        clientSideSync(data.sentFromServerTime, data.sentFromClientTime, data.wastedTime, data.serverStartTime);
    },
    showClock: function () {
        console.log('game time now ' + module.exports.now());
        console.log('date.now() ' + Date.now());
    }
};