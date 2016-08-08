export default class LagEstimationCalculator {

    constructor(){
        "use strict";
        //todo: find a way to tell if we've underestimated lag
        //todo: do analysis on how evenly split lag is in coming/receiving
        //is it always 50/50 or commonly 70/30 etc
        this.minimumLag = 1000;//this should never be less then actual lag
        this.offsetEstimate = 0;
    }

    estimateClientServerOffset(clientSentTime, serverTime){
        "use strict";
        let currentTime = Date.now();
        let estimationFactor = 0.65; //the closer this is to 0.5, the more accurate it's likely to be
                                     //but the more likely you are to underestimate newLag

        let newLag = (currentTime - clientSentTime) * estimationFactor;

        if(newLag < this.minimumLag){
            this.minimumLag = newLag;
            console.log("new min lag:");
            console.log(this.minimumLag);
            this.offsetEstimate = currentTime - serverTime - newLag;
        }
    }

    estimateLag(clientTime, serverTime){
        "use strict";

        return clientTime - serverTime - this.offsetEstimate;
    }

}
