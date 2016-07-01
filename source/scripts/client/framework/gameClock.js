/*jslint browserify: true, devel: true*/
'use strict';

//New thought:
//client should track in local time
//on receiving states, they should be converted in local time for use
//if sending gameTimes for moves to server, they should be calculated on send

//if you ever receive a serverState in the future
//we should update to it, set game time to match it
//and go from there (though it does indicate somethings wrong)

//this timing/syncing method relies on:
//1) Any offset between the server and client Date.now()'s remaining constant
export default class GameClock{
    constructor(){
        //default must be larger then any reasonable time
        //so we always overestimate lag, never under
        //10 seconds would would make the game unplayable anyway
        //if lag is underestimate, client will not rewind far enough
        //or, if underestimate is more then lag, think any server states it gets are in the future
        this.minimumRoundTrip = 10000;
    }

    static estimateLagPacketPayload(){
        return {"originalClientTime": Date.now()};
    }

    //add a parameter "wasted time" if the server does stuff before it replies
    estimateLag(payload){
        let finalClientTime = Date.now();
        this.serverStartTime = payload.serverStartTime;
        let originalClientTime = payload.originalClientTime;
        let serverTime = payload.serverTime;
        let roundTrip = finalClientTime - originalClientTime;

        //estimate lag
        let lag = roundTrip * 0.65;//more then half to help avoid underestimates
        //we use min roundTrip, because lag is an estimate (roundTrip/2)
        //and the small total journey time, the less room for (roundTrip/2) to be wrong
        if(roundTrip < this.minimumRoundTrip){
            this.minimumRoundTrip = roundTrip;
            console.log("new min roundTrip: " + this.minimumRoundTrip);

            this.startTotalDifference = finalClientTime - serverTime;
            //this relies on lag being the exact lag of this journey
            this.timeDiff = this.startTotalDifference - lag;

            this.startLag = this.startTotalDifference - this.timeDiff;

            let serverDelta = serverTime - this.serverStartTime;
            this.localTimeWhenServerStarted = finalClientTime - serverDelta - this.startLag;
        }
    }

    newStateTime(stateGameTime){
        //if we received a state which transaltes to a local time in the future
        //we have probably overestimate server start time
        //so reduce it
        let cachedNow = Date.now();
        let stateLocalTime = this.toLocalTime(stateGameTime);
        if(stateLocalTime > cachedNow){
            this.minimumRoundTrip *= 2;
            this.localTimeWhenServerStarted -= stateLocalTime - (cachedNow + 200);
        }
    }

    //stored gameTimes will end up invalid when this.localTimeWhenServerStarted changes!
    //all stored times should be in local, then converted on use
    toGameTime(localTime){
        if(!("localTimeWhenServerStarted" in this)){
            return 0;
        }else{
            return localTime - this.localTimeWhenServerStarted;
        }
    }

    toLocalTime(gameTime){
        return gameTime + this.localTimeWhenServerStarted;
    }
}