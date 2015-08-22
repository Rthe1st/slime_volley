/*jslint browser: true, browserify: true, devel: true*/
'use strict';

export default class{
    constructor(cords, score, game) {
        this.x = cords.x;
        this.y = cords.y;
        this.scoreText = game.add.text(this.x, this.y, '', {
            font: 'bold 20pt Arial',
            stroke: '#FFFFFF',
            strokeThickness: 10
        });
        this.setScore(score);
    }

    setScore(value) {
        this.score = value;
        this.scoreText.setText('Score: ' + this.score);
    }

    //relative is a boolean, if false, value is added to current score
    changeScore(value) {
        this.score += value;
        this.scoreText.setText('Score: ' + this.score);
    }
}