export default class GameClock{
    constructor(){
        this.startTime = Date.now();
    }


    gameTime(){
        return Date.now() - this.startTime;
    }
    //have some code for estimating client lags?
    //so they can only trick us into thinking their lags are too high
}
