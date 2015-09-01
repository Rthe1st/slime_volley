/*jslint browser: true, browserify: true, devel: true*/
'use strict';

import {settings, Mechanics} from './mechanics.js';

import {limitVelocity} from './GameMaths.js';

export default class extends Phaser.Sprite {
    constructor(x, y, color, mechanics) {
        super(mechanics.game, x, y);
        this.mechanics = mechanics;
        this.maxSpeed = 500;
        this.moveForce = 5000;
        this.breakingRate = 0;
        var size = 54;
        this.name = name;
        //not sure what this does, if the drawCircle and body circle are given the same values
        //this is needed to make collision match up (maybe scales drawing to body?)

        this.moveTimeOut = 0;//in ms
        this.lastMoveTime = 0;

        //  Create our physics body.
        this.game.physics.p2.enable(this, settings.debug);

        this.body.setCircle(size/2);

        this.body.mass = 10;

        this.body.collideWorldBounds = true;

        this.body.setMaterial(this.mechanics.material.slime);

        if(settings.frontEnd) {

            //drawing
            var graphic = this.game.add.graphics();
            graphic.beginFill(color);
            graphic.drawCircle(0, 0, size);
            graphic.endFill();
            this.addChild(graphic);

            this.moveTimerArc = this.game.add.graphics();
            var slime = this;
            this.moveTimerArc.update = function () {
                this.clear();
                this.beginFill(0xffffff);
                var percentageOfTimePast = ((slime.mechanics.now() - slime.lastMoveTime) / slime.moveTimeOut);
                percentageOfTimePast = Math.min(1, percentageOfTimePast);
                var startAngle = -Math.PI / 2;
                var maxAngle = 2 * Math.PI + startAngle;
                //why the fuckity fukcwit is this needed
                this.drawCircle(0, 0, 0);
                this.arc(0, 0, (size / 2) * 0.5, startAngle, maxAngle * percentageOfTimePast);
                this.endFill();
            };
            this.addChild(this.moveTimerArc);

        }

        this.game.add.existing(this);
    }

    pack(){
        var data = Mechanics.packageBody(this.body);
        data.lastMoveTime = this.lastMoveTime;
        return data;
    }

    unPack(data){
        this.mechanics.loadBody(data, this.body);
        this.lastMoveTime = data.lastMoveTime;
    }

    move(inputSample) {
        if(this.mechanics.now() - this.moveTimeOut > this.lastMoveTime) {
            this.lastMoveTime = this.mechanics.now();
            if (settings.useMouse) {
                this.mouseMove(inputSample);
            } else {
                this.keyboardMove(inputSample);
            }
        }
    }

    keyboardMove(inputSample) {
        var force = {x: 0, y: 0};
        var velocity = this.body.velocity;
        var directions = {
            'LEFT': {axis: 'x', scaling: -1},
            'RIGHT': {axis: 'x', scaling: 1},
            'UP': {axis: 'y', scaling: -1},
            'DOWN': {axis: 'y', scaling: 1}
        };
        //reference for nested functions (who cant access slime via this)
        var slime = this;

        function move(direction) {
            //-1 because force axes are inverted vs velocity axes?!?
            force[direction.axis] = slime.moveForce * -1 * direction.scaling;
            var directionOppsesVelocity = (velocity[direction.axis] * direction.scaling) < 0;
            if (directionOppsesVelocity) {
                velocity[direction.axis] *= slime.breakingRate;
            }
        }
        if (inputSample.down) {
            move(directions.DOWN);
        } else if (inputSample.up) {
            move(directions.UP);
        }
        if (inputSample.left) {
            move(directions.LEFT);
        } else if (inputSample.right) {
            move(directions.RIGHT);
        }
        this.body.applyForce([force.x, force.y], this.body.x, this.body.y);
    }

    mouseMove(inputSample) {
        var force = {x: 0, y: 0};
        var velocity = this.body.velocity;
        var mouseDirection = {x: inputSample[0], y: inputSample[1]};
        //reference for nested functions (who cant access slime via this)
        var slime = this;

        function move(axis) {
            //-1 because force axes are inverted vs velocity axes?!?
            force[axis] = slime.moveForce * -1 * mouseDirection[axis];
            var directionOpposesVelocity = (velocity[axis] * mouseDirection[axis]) < 0;
            if (directionOpposesVelocity) {
                velocity[axis] *= slime.breakingRate;
            }
        }
        move('x');
        move('y');
        this.body.applyForce([force.x, force.y], this.body.x, this.body.y);
    }

    update(){
        if(settings.frontEnd) {
            this.moveTimerArc.update();
        }
        limitVelocity(this.body.velocity, this.maxSpeed);
    }
}