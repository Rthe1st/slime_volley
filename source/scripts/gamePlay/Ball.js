/*jslint browser: true, browserify: true, devel: true*/
'use strict';

import {settings} from './mechanics.js';

import {limitVelocity} from './GameMaths.js';

export default class extends Phaser.Sprite {
    constructor(x, y, color, mechanics) {
        super(mechanics.game, x, y);
        this.mechanics = mechanics;
        this.startCords = {x: x, y: y};
        this.owner = null;//the team that last touched the ball
        var size = 12;
        this.maxSpeed = 400;
        //not sure what this does, if the drawCircle and body circle are given the same values
        //this is needed to make collision match up (maybe scales drawing to body?)
        this.scale.set(2);

        //  Create our physics body.
        this.game.physics.p2.enable(this, settings.debug);

        this.body.setCircle(size);

        this.body.mass = 2;

        this.body.collideWorldBounds = true;

        this.body.setMaterial(mechanics.material.ball);

        this.body.onEndContact.add(this.endContact, this);

        //drawing
        var graphic = this.game.add.graphics();
        graphic.beginFill(color);
        graphic.drawCircle(0, 0, size);
        graphic.endFill();
        this.addChild(graphic);

        this.game.add.existing(this);
    }

    endContact(body) {
        //could be sped up by checking type of body first
        for (var i = 0; i < this.mechanics.teams.length; i++) {
            //consider disallowing this client side, so score only changes when confirmed by server
            if (body === this.mechanics.teams[i].goal.body) {
                if (i === 0) {
                    this.mechanics.teams[1].statCard.changeScore(1);
                } else if (i === 1) {
                    this.mechanics.teams[0].statCard.changeScore(1);
                }
                this.mechanics.goalScored = true;
                return;
            } else {
                for (var slimeIndex = 0; slimeIndex < this.mechanics.teams[i].slimes.length; slimeIndex++) {
                    if (body === this.mechanics.teams[i].slimes[slimeIndex].body) {
                        this.owner = this.mechanics.teams[i];
                        return;
                    }
                }
            }
        }
    }

    reset() {
        console.log('reset');
        super.reset(this.startCords.x, this.startCords.y);
        this.body.setZeroRotation();
        this.body.setZeroVelocity();
        this.body.setZeroForce();
        this.owner = null;
    }

    update() {
        limitVelocity(this.body.velocity, this.maxSpeed);
    }
}