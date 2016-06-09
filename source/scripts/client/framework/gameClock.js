/*jslint browserify: true, devel: true*/
'use strict';

//this timing/syncing method relies on:
//1) Any offset between the server and client Date.now()'s remaining constant
export default class GameClock{
    constructor(){
        //default must be larger then any reasonable time
        //10 seconds would would make the game unplayable anyway
        this.minimumRoundTrip = 10000;
    }

    estimateLagPacketPayload(){
        return {"originalClientTime": Date.now()};
    }

    //add a parameter "wasted time" if the server does stuff before it replies
    estimateLag(payload){
        let finalClientTime = Date.now();
        this.serverStartTime = payload.serverStartTime;
        let originalClientTime = payload.originalClientTime;
        let serverTime = payload.serverTime;
        let roundTrip = finalClientTime - originalClientTime;

        //estiamte lag
        let lag = roundTrip/2;
        //we use min roundTrip, because lag is an estimate (roundTrip/2)
        //and the small total journey time, the less room for (roundTrip/2) to be wrong
        if(roundTrip < this.minimumRoundTrip){
            this.minimumRoundTrip = roundTrip;
            console.log("new min roundTrip: " + this.minimumRoundTrip);

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
