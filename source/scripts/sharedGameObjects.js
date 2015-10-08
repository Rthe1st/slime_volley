/*jslint browser: true, browserify: true, devel: true*/
/* global io*/
'use strict';

var gameClock = require('./GameClock.js');

var geometryHelpers = require('./geometryHelpers.js');

function packageBody(body) {
    //rotation and rotation velocity needed as well
    //(as soon as players/balls are non-symentrical/non-circles)
    var bodyData = {};
    bodyData.position = {x: body.x, y: body.y};
    bodyData.velocity = {x: body.velocity.x, y: body.velocity.y};
    //force is reset at the end of every frame
    //but we still need to send it because the state is sent mid-frame
    //so force hasnt been applied yet
    bodyData.force = {x: body.force.x, y: body.force.y};
    //isnt currently needed as we apply force to center of body
    //but applyForce method used in moveslime can potentialy effect it
    bodyData.angularForce = body.angularForce;
    return bodyData;
}

function loadBody(bodyData, body) {
    //rotation and rotation velocity needed as well
    //(as soon as players/balls are non-symentrical/non-circles)
    body.x = bodyData.position.x;
    body.y = bodyData.position.y;
    body.velocity.x = bodyData.velocity.x;
    body.velocity.y = bodyData.velocity.y;
    body.force.x = bodyData.force.x;
    body.force.y = bodyData.force.y;
    body.angularForce = bodyData.angularForce;
}

class Goal {
    constructor(team){
        this.collisionType = 'Goal';
        this.team = team;
    }
    bodySetup(){
        this.body.static = true;
        this.body.setRectangle(50, 100, 0, 0, 0);
    }
}

class Ball{
    constructor(x, y) {
        this.collisionType = 'Ball';
        this.startCords = {x: x, y: y};
        this.owner = null;//the team that last touched the ball
        this.size = 12;
        this.maxSpeed = 400;
    }
    bodySetup(){
        this.body = new p2.Body({
            mass:5,
            position:[0,10]
        });
        var circleShape = new p2.Circle({ radius: 1 });
        circleBody.addShape(circleShape);

        this.body.collideWorldBounds = true;

        //this.body.setMaterial(material.ball);

        //this.body.onEndContact.add(this.endContact, this);
    }

    pack(){
        return packageBody(this.body);
    }

    unPack(bodyData){
        loadBody(bodyData, this.body);
    }

    reset() {
        console.log('reset');
        this.body.reset(this.startCords.x, this.startCords.y);
        this.owner = null;
    }

    update() {
        geometryHelpers.limitVelocity(this.body.velocity, this.maxSpeed);
    }
}

class Slime{
    constructor(x, y, team) {

        this.startingPosition = {x:x, y:y};
        this.collisionType = 'Slime';
        this.maxSpeed = 500;
        this.moveForce = 5000;
        this.breakingRate = 0;
        this.size = 54;
        this.name = name;

        this.moveTimeOut = 0;//in ms
        this.lastMoveTime = 0;

        this.team = team;
    }

    bodySetup(){
        this.body.setCircle(this.size/2);

        this.body.mass = 10;

        this.body.collideWorldBounds = true;

        //this.body.setMaterial(material.slime);
    }

    pack(){
        var data = packageBody(this.body);
        data.lastMoveTime = this.lastMoveTime;
        return data;
    }

    unPack(data){
        loadBody(data, this.body);
        data.lastMoveTime = this.lastMoveTime;
    }

    move(inputSample, useMouse) {
        if(gameClock.now() - this.moveTimeOut > this.lastMoveTime) {
            this.lastMoveTime = gameClock.now();
            if (useMouse) {
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
        //cant rely on phaser
        this.body.applyForce([force.x, force.y], this.body.x, this.body.y);
    }

    update(){
        geometryHelpers.limitVelocity(this.body.velocity, this.maxSpeed);
    }

    reset(){
        this.body.reset(this.startingPosition.x, this.startingPosition.y);

    }
}

class Team {
    constructor() {
        this.slimes = [];
        this.score = 0;
    }
    reset() {
        for (var i = 0; i < this.slimes.length; i++) {
            this.slimes[i].reset();
        }
    }
    changeScore(amount){
        this.score+= amount;
    }
}

module.exports = {
    Goal: Goal,
    Ball: Ball,
    Slime: Slime,
    Team: Team
};