/*jslint browser: true, browserify: true, devel: true*/
'use strict';

import Ball from './Ball.js';
import Slime from './Slime.js';
import Team from './Team.js';
import {normaliseXY} from './GameMaths.js';

export let settings = {useMouse: true, initialGoalSize: {height: 100, width: 50}, debug: false, frontEnd: true};

var gui;

export class Mechanics {
    constructor(nowFunction, allowGUI, debug) {
        this.now = nowFunction;
        //this.allowGUI = settings.frontEnd = allowGUI;
        //settings.debug = debug;
    }

    setupPhysics(){
        this.PhaserWrapper.game.physics.startSystem(this.framework.Physics.P2JS);
        this.material = {
            slime: new this.framework.Physics.P2.Material('SLIME'),
            ball: new this.framework.Physics.P2.Material('BALL')
        };
        this.PhaserWrapper.game.physics.p2.restitution = 0.5;
        this.PhaserWrapper.game.physics.p2.gravity.y = 0;
        this.PhaserWrapper.game.physics.p2.friction = 0.9;

        var slime_ball_contact = new this.framework.Physics.P2.ContactMaterial(this.material.slime, this.material.ball, {
            restitution: 0.75,
            stiffness: Number.MAX_VALUE,
            friction: 0.99
        });
        this.PhaserWrapper.game.physics.p2.addContactMaterial(slime_ball_contact);
    }

    create() {

        if (settings.frontEnd) {

            var keyCodes = {w: 87, a: 65, s: 83, d: 68};
            this.controls = {
                up: this.PhaserWrapper.game.input.keyboard.addKey(keyCodes.w),
                left: this.PhaserWrapper.game.input.keyboard.addKey(keyCodes.a),
                down: this.PhaserWrapper.game.input.keyboard.addKey(keyCodes.s),
                right: this.PhaserWrapper.game.input.keyboard.addKey(keyCodes.d)
            };
        }

        this.setupPhysics();

        this.goalScored = false;
        this.teams = [];
        this.balls = [];

        let worldSize = this.PhaserWrapper.worldSize();

        this.teams[0] = new Team(0x0000ff,
            {x: settings.initialGoalSize.width / 2, y: worldSize.height / 2},
            {x: worldSize.width / 4, y: worldSize.height / 2},
            {x: worldSize.width / 4, y: 0},
            this
        );
        this.teams[1] = new Team(0xff0000,
            {x: worldSize.width - settings.initialGoalSize.width / 2, y: worldSize.height / 2},
            {x: worldSize.width * 3 / 4, y: worldSize.height / 2},
            {x: worldSize.width * 3 / 4, y: 0},
            this
        );

        this.balls[0] = new Ball(worldSize.width / 2, worldSize.height / 2, 0xffffff, this);

        //this. is required because we have to manualy .bind create() to stop 'this' being phaser
        this.internalPostCreate();
        if (this.externalPostCreate != undefined) {
            this.externalPostCreate();
        }
    }

    internalPostCreate() {
        if (settings.frontEnd) {
            document.getElementById('pausePlay').onclick = function () {
                if (!this.PhaserWrapper.game.stepping) {
                    this.PhaserWrapper.game.enableStep();
                } else {
                    this.PhaserWrapper.game.disableStep();
                }
            };
            document.getElementById('step').onclick = function () {
                this.PhaserWrapper.game.step();
            };
            document.getElementById('showXY').onclick = function () {
                this.printSlimeXY(0, 0);
                this.printSlimeXY(1, 0);
            }.bind(this);
            //take a param to do this
            if (this.allowGUI) {
                loadGUI(this.teams, this.balls);
            }
        }
    }

    startGame(update, tExternalPostCreate) {
        this.externalPostCreate = tExternalPostCreate;
        this.PhaserWrapper.startGame(this.create.bind(this), update);
    }

    timeStep() {
        return 1000 / this.PhaserWrapper.fps();
    }

    sampleInput(teamNum, slimeNum) {
        if(!settings.frontEnd){
            return;
        }
        if (this.now() - this.teams[teamNum].slimes[slimeNum].moveTimeOut < this.teams[teamNum].slimes[slimeNum].lastMoveTime) {
            return null;
        }
        if (settings.useMouse) {
            return this.sampleMouse(teamNum, slimeNum);
        } else {
            return this.sampleKeyboard();
        }
    }

    sampleMouse(teamNum, slimeNum) {
        var slime = this.teams[teamNum].slimes[slimeNum];
        var relativePoint = {x: slime.body.x, y: slime.body.y};
        var mousePointer = this.PhaserWrapper.game.input.mousePointer;
        if (mousePointer.leftButton.isDown) {
            var inputSample = new Float64Array(2);
            //extract a normalised direction from player to mouse
            var rawDiff = {x: mousePointer.worldX - relativePoint.x, y: mousePointer.worldY - relativePoint.y};
            var normalised = normaliseXY(rawDiff);
            inputSample[0] = normalised.x;
            inputSample[1] = normalised.y;
            inputSample[0] = Math.round(normalised.x * 100) / 100;
            inputSample[1] = Math.round(normalised.y * 100) / 100;
            return inputSample;
        } else {
            return null;
        }
    }

    sampleKeyboard() {
        var inputSample = {up: false, down: false, left: false, right: false};
        Object.keys(this.controls).forEach(function (key) {
            if (this.controls[key].isDown) {
                inputSample[key] = true;
            }
        });
        if (inputSample.up || inputSample.down || inputSample.left || inputSample.right) {
            return inputSample;
        } else {
            return null;
        }
    }

    localUpdate() {
        if (this.goalScored) {
            this.teams.forEach((currentTeam)=>currentTeam.reset());
            this.balls.forEach(currentBall=>currentBall.reset());
            this.goalScored = false;
        }
    }

    printSlimeXY(team, slime) {
        var x = this.teams[team].slimes[slime].body.x;
        var y = this.teams[team].slimes[slime].body.y;
        console.log('team ' + team + ' slime ' + slime + ' x: ' + x + ' y: ' + y);
    }

    //requires .timestamp, .inputSample, .slime, .team on inputElements
    fastForward(initialGameTime, inputElements, recordStateCallback) {
        //this sort could be expensive, if slow, good bottleneck candidate
        inputElements.sort((a, b) => a.timeStamp - b.timeStamp);
        var inputElement = 0;
        var simulatedTime = 0;
        console.log('time to make up in seconds: ' + (this.now() - initialGameTime) / 1000);
        while (initialGameTime + simulatedTime < this.now()) {
            simulatedTime += timeStep();
            var timeToMakeUp = this.now() - (initialGameTime + simulatedTime);
            //extrapolating more then 100 steps is crazy, just give up (100*1/60=1.6seconds)
            if (timeToMakeUp > timeStep() * 100) {
                // break;
            }
            if (inputElement < inputElements.length && initialGameTime + simulatedTime > inputElements[inputElement].timeStamp) {
                var inputToUse = inputElements[inputElement];
                inputElement++;
                moveSlime(inputToUse.team, inputToUse.slime, inputToUse.inputSample);
                localUpdate();
            }
            if (recordStateCallback) {
                recordStateCallback(packageState(), initialGameTime + simulatedTime);
            }
            this.PhaserWrapper.manualUpdate();
        }
    }

    static packageBody(body) {
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

    packageState() {
        var state = {};
        state.teams = [];
        for (var i = 0; i < this.teams.length; i++) {
            state.teams[i] = {};
            state.teams[i].score = this.teams[i].statCard.score;
            state.teams[i].slimes = [];
            for (var slimeNum = 0; slimeNum < this.teams[i].slimes.length; slimeNum++) {
                state.teams[i].slimes[slimeNum] = this.teams[i].slimes[slimeNum].pack();
            }
        }
        state.balls = [];
        for (var g = 0; g < this.balls.length; g++) {
            state.balls[g] = Mechanics.packageBody(this.balls[g].body);
        }
        return state;
    }

    static loadBody(bodyData, body) {
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

    loadNewState(state) {
        for (var i = 0; i < state.teams.length; i++) {
            this.teams[i].statCard.setScore(state.teams[i].score);
            for (var slimeNum = 0; slimeNum < state.teams[i].slimes.length; slimeNum++) {
                var stateSlime = state.teams[i].slimes[slimeNum];
                this.teams[i].slimes[slimeNum].unPack(stateSlime);
            }
        }
        for (var g = 0; g < this.balls.length; g++) {
            Mechanics.loadBody(state.balls[g], this.balls[g].body);
        }
    }

    moveSlime(teamNum, slimeNum, inputSample) {
        this.teams[teamNum].slimes[slimeNum].move(inputSample);
    }

}

export function storeGUI(tGui) {
    gui = tGui;
}

var loadGUI = function (teams, balls) {
    gui.add(settings, 'useMouse');
    for (var teamNum = 0; teamNum < teams.length; teamNum++) {
        var team = teams[teamNum];
        var teamFolder = gui.addFolder('Team ' + teamNum);
        for (var slimeNum = 0; slimeNum < team.slimes.length; slimeNum++) {
            var slime = team.slimes[slimeNum];
            var slimeFolder = teamFolder.addFolder('Slime ' + slimeNum);
            slimeFolder.add(slime, 'maxSpeed');
            slimeFolder.add(slime, 'breakingRate');
            slimeFolder.add(slime, 'moveForce');
            slimeFolder.add(slime.body, 'mass');
            slimeFolder.add(slime, 'moveTimeOut');
        }
    }
    for (var ballNum = 0; ballNum < balls.length; ballNum++) {
        var ball = balls[ballNum];
        var ballFolder = gui.addFolder('Ball ' + ballNum);
        ballFolder.add(ball, 'maxSpeed');
        ballFolder.add(ball.body, 'mass');
    }
};