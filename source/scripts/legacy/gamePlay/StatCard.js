/*jslint browser: true, browserify: true, devel: true*/
'use strict';

import {settings} from './mechanics.js';

//todo: move score into teams so this becomes a purly graphicl class?
export default class {
    constructor(cords, score, game) {
        this.x = cords.x;
        this.y = cords.y;
        if (settings.frontEnd) {
            this.scoreText = game.add.text(this.x, this.y, '', {
                font: 'bold 20pt Arial',
                stroke: '#FFFFFF',
                strokeThickness: 10
            });
        }
        this.setScore(score);
    }

    setScore(value) {
        this.score = value;
        if (settings.frontEnd) {
            this.scoreText.setText('Score: ' + this.score);
        }
    }

    //relative is a boolean, if false, value is added to current score
    changeScore(value) {
        this.score += value;
        if (settings.frontEnd) {
            this.scoreText.setText('Score: ' + this.score);
        }
    }
}