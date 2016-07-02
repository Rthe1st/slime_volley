/*jslint browserify: true, devel: true*/
'use strict';

export default class GameClock{
    constructor(){
        this.frameCount = 0;
        this.ms_per_frame = 1000/60;
    }

    get discreteTime(){
        return this.frameCount;
    }

    get smoothTime(){
        return this.frameCount * this.ms_per_frame;
    }
}