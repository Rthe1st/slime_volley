"use strict";

export default class LagEstimationCalculator {

    constructor(){
        //todo: find a way to tell if we've underestimated lag
        //todo: do analysis on how evenly split lag is in coming/receiving
        //is it always 50/50 or commonly 70/30 etc
        this.lagEstimate = 1000;//this should never be less then actual lag
    }

    estimateClientServerOffset(clientSentTime, serverTime){
        let currentTime = Date.now();
        //the closer this is to 0, the more accurate it's likely to be
        //but the more likely you are to underestimate newLag
        let estimationFactor = 0.65;

        let newLag = (currentTime - clientSentTime) * estimationFactor;

        if(newLag < this.lag){
            this.offsetEstimate = currentTime - serverTime - newLag;
        }
    }

    estimateLag(clientTime, serverTime){
        return clientTime - serverTime - this.offsetEstimate;
    }

}