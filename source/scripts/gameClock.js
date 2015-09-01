/*jslint browserify: true, devel: true*/
'use strict';


//decided to trust client side lag measurement
//they can increase it arbitarilty anyway
//as long as I check lag is positive, at most client can cancel effects of rewind
//by giving a shorter lag then is true

export default class GameClock {
    constructor(tServerStartTime) {
        //for client, use this a s a first guess, but then correct with piggybacksync
        this.localStartTime = this.serverStartTime = tServerStartTime || Date.now();

        this.bestPing = null;
    }

    startTime() {
        return this.serverStartTime;
    }

    now() {
        return Date.now() - this.localStartTime;
    }

    toGameTime(timeStamp) {
        return timeStamp - this.localStartTime;
    }

    static manualSync(socket) {
        socket.emit('manual sync', {sentFromClientTime: Date.now()});
    }

    static piggyBackSync(data) {
        //technically, if data.curGameTime exists, it could be used instead
        //saving on packet size a wee bit
        data.sentFromClientTime = Date.now();
    }

    syncReponse(data) {
        //this could try to piggy back on serversend state, by accounting for wasted time
        clientSideSync(data.sentFromServerTime, data.sentFromClientTime, data.wastedTime, data.serverStartTime);
    }

    //wastedTime could be how long before the server got round to repeating the message
    clientSideSync(sentFromServerTime, sentFromClientTime, wastedTime, tServerStartTime) {
        this.serverStartTime = tServerStartTime;
        var pingTime = (Date.now() - sentFromClientTime) / 2 - wastedTime;
        if (pingTime < this.bestPing || this.bestPing === null) {
            console.log('best ping ' + this.bestPing);
            console.log('new ping' + pingTime);
            this.bestPing = pingTime;
            var timeOffset = Date.now() - sentFromServerTime;
            this.localStartTime = this.serverStartTime + timeOffset - pingTime;
        }
    }

    showClock() {
        console.log('game time now ' + this.now());
        console.log('date.now() ' + Date.now());
    }
}