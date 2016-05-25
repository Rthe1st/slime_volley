/*jslint browserify: true, devel: true*/
'use strict';

//this timing/syncing method relies on:
//1) Any offset between the server and client Date.now()'s remaining constant
export default class GameClock{
    constructor(){
    }

    estimateLagPacketPayload(){
        return {"originalClientTime": Date.now()};
    }

    //add a parameter "wasted time" if the server does stuff before it replies
    estimateLag(originalClientTime, serverTime){
        let finalClientTime = Date.now();
        let roundTrip = originalClientTime - finalClientTime;

        //estiamte lag
        let lag = roundTrip/2;
        //we use min roundTrip, because lag is an estimate (roundTrip/2)
        //and the small total journey time, the less room for (roundTrip/2) to be wrong
        if(roundTrip < this.minimumRoundTrip){
            this.minimumRoundTrip = roundTrip;

            let currentTime = finalClientTime;
            this.startTotalDifference = currentTime - serverTime;
            //this relies on lag being the extact lag of this jounry
            this.timeDiff = this.startTotalDifference - lag;

            this.startLag = this.startTotalDifference - this.timeDiff;

            let serverDelta = serverTime - this.serverStartTime;
            this.localTimeWhenServerStarted = finalClientTime - serverDelta - this.startLag;
        }
    }

    gameTime(){
        if(!("localTimeWhenServerStarted" in this)){
            return 0;
        }else{
            return Date.now() - this.localTimeWhenServerStarted;
        }
    }
}
