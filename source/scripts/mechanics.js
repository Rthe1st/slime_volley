/*jslint browser: true, browserify: true, devel: true*/
/* global Phaser, io*/
'use strict';

var gameClock = require('./gameClock.js');

var settings = {useMouse: false};

var gui;

var storeGUI = function(tGui){
    gui = tGui;
};

var loadGUI = function(){
    gui.add(settings, 'useMouse');
    for (var teamNum = 0; teamNum < teams.length; teamNum++) {
        var team = teams[teamNum];
        var teamFolder = gui.addFolder('Team '+teamNum);
        for (var slimeNum = 0; slimeNum < team.slimes.length; slimeNum++) {
            var slime = team.slimes[slimeNum];
            var slimeFolder = teamFolder.addFolder('Slime '+slimeNum);
            slimeFolder.add(slime, 'maxSpeed');
            slimeFolder.add(slime, 'breakingRate');
            slimeFolder.add(slime, 'moveForce');
            slimeFolder.add(slime.body, 'mass');
        }
    }
    for (var ballNum=0; ballNum < balls.length; ballNum++) {
        var ball = balls[ballNum];
        var ballFolder = gui.addFolder('Ball '+ballNum);
        ballFolder.add(ball, 'maxSpeed');
        ballFolder.add(ball.body, 'mass');
    }
};

var auth;

var game;

var material;

var teams = [];

var balls = [];

var INITIAL_GOAL_SIZE = {HEIGHT: 100, WIDTH: 50};

var goalScored = false;

var controls;

function preload() {
}

class Goal extends Phaser.Sprite {
    constructor(x, y, color) {
        super(game, x, y);
        this.name = 'goal';

        var graphic = game.add.graphics();
        graphic.beginFill(color);
        graphic.drawRect(-INITIAL_GOAL_SIZE.WIDTH / 2, -INITIAL_GOAL_SIZE.HEIGHT / 2, INITIAL_GOAL_SIZE.WIDTH, INITIAL_GOAL_SIZE.HEIGHT);
        this.addChild(graphic);

        game.physics.p2.enable(this);
        this.body.static = true;
        this.body.setRectangle(INITIAL_GOAL_SIZE.WIDTH, INITIAL_GOAL_SIZE.HEIGHT, 0, 0, 0);
        this.body.debug = true;
        game.add.existing(this);
    }
}
class Ball extends Phaser.Sprite {
    constructor(x, y, color) {
        super(game, x, y);
        this.startCords = {x: x, y: y};
        this.owner = null;//the team that last touched the ball
        var size = 12;
        this.maxSpeed = 400;
        //not sure what this does, if the drawCircle and body circle are given the same values
        //this is needed to make collision match up (maybe scales drawing to body?)
        this.scale.set(2);

        //drawing
        var graphic = game.add.graphics();
        graphic.beginFill(color);
        graphic.drawCircle(0, 0, size);
        this.addChild(graphic);

        //  Create our physics body.
        game.physics.p2.enable(this);

        this.body.setCircle(size);

        this.body.mass = 2;

        this.body.collideWorldBounds = true;

        this.body.setMaterial(material.ball);

        this.body.debug = true;

        this.body.onEndContact.add(this.endContact, this);

        game.add.existing(this);
    }

    endContact(body) {
        //could be sped up by checking type of body first
        for (var i = 0; i < teams.length; i++) {
            //consider disallowing this client side, so score only changes when confirmed by server
            if (body === teams[i].goal.body) {
                if (i === 0) {
                    teams[1].statCard.changeScore(1);
                } else if (i === 1) {
                    teams[0].statCard.changeScore(1);
                }
                goalScored = true;
                return;
            } else {
                for (var slimeIndex = 0; slimeIndex < teams[i].slimes.length; slimeIndex++) {
                    if (body === teams[i].slimes[slimeIndex].body) {
                        this.owner = teams[i];
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
}

class Slime extends Phaser.Sprite {
    constructor(x, y, color) {
        super(game, x, y);
        this.maxSpeed = 200;
        this.moveForce = 2000;
        this.breakingRate = 0.3;
        var size = 28;
        this.name = name;
        //not sure what this does, if the drawCircle and body circle are given the same values
        //this is needed to make collision match up (maybe scales drawing to body?)
        this.scale.set(2);

        //drawing
        var graphic = game.add.graphics();
        graphic.beginFill(color);
        graphic.drawCircle(0, 0, size);
        this.addChild(graphic);

        //  Create our physics body.
        game.physics.p2.enable(this);

        this.body.setCircle(size);

        this.body.mass = 10;

        this.body.collideWorldBounds = true;

        this.body.setMaterial(material.slime);

        this.body.debug = true;
        game.add.existing(this);
    }

    move(inputSample) {
        if (settings.useMouse) {
            this.mouseMove(inputSample);
        } else {
            this.keyboardMove(inputSample);
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
            force[direction.axis] = 2000 * -1 * direction.scaling;
            var directionOppsesVelocity = (velocity[direction.axis] * direction.scaling) < 0;
            if (directionOppsesVelocity) {
                velocity[direction.axis] /= 3;
            }
        }
        function limitVelocity(axis){
            if (velocity[axis] > slime.maxSpeed) {
                velocity[axis] = slime.maxSpeed;
            } else if (velocity[axis] < -slime.maxSpeed) {
                velocity[axis] = -slime.maxSpeed;
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
        //force isn't applied until after update, so its effect cannot be limited here
        //so real speed can be maxSpeed + force effect
        //could move limit to a post physics function to fix
        limitVelocity('x');
        limitVelocity('y');
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
            force[axis] = 2000 * -1 * mouseDirection[axis];
            var directionOpposesVelocity = (velocity[axis] * mouseDirection[axis]) < 0;
            if (directionOpposesVelocity) {
                velocity[axis] /= 3;
            }
        }

        function limit() {
            var magnitude = magnitudeXY(velocity);
            var normalised = normaliseXY(velocity);
            if (magnitude > slime.maxSpeed) {
                velocity.x = slime.maxSpeed * normalised.x;
                velocity.y = slime.maxSpeed * normalised.y;
            }
        }
        move('x');
        move('y');
        //force isn't applied until after update, so its effect cannot be limited here
        //so real speed can be maxSpeed + force effect
        //could move limit to a post physics function to fix
        limit();
        this.body.applyForce([force.x, force.y], this.body.x, this.body.y);
    }
}

class StatCard {
    constructor(cords, score) {
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

class Team {
    constructor(color, goalCords, slimeCords, statCords) {
        this.startSlimeCords = slimeCords;
        this.color = color;
        this.goal = new Goal(goalCords.x, goalCords.y, this.color);
        this.slimes = [];
        this.slimes[0] = new Slime(slimeCords.x, slimeCords.y, this.color);
        this.statCard = new StatCard(statCords, 0);
    }

    reset() {
        for (var i = 0; i < this.slimes.length; i++) {
            var slimeSprite = this.slimes[i];
            slimeSprite.body.setZeroRotation();
            slimeSprite.body.setZeroVelocity();
            slimeSprite.body.setZeroForce();
            slimeSprite.reset(this.startSlimeCords.x, this.startSlimeCords.y);
        }
    }
}

function onGoalReset() {
    for (var i = 0; i < teams.length; i++) {
        teams[i].reset();
    }
    for (var g = 0; g < balls.length; g++) {
        balls[g].reset();
    }
}

var steppingTest = function(){
    //our step sizes are fixed and at 1/60 by default
    game.enableStep();

};

function create() {

    game.physics.startSystem(Phaser.Physics.P2JS);
    var keyCodes = {w: 87, a: 65, s: 83, d: 68};
    controls = {
        up: game.input.keyboard.addKey(keyCodes.w),
        left: game.input.keyboard.addKey(keyCodes.a),
        down: game.input.keyboard.addKey(keyCodes.s),
        right: game.input.keyboard.addKey(keyCodes.d)
    };

    material = {
        slime: new Phaser.Physics.P2.Material('SLIME'),
        ball: new Phaser.Physics.P2.Material('BALL')
    };

    game.physics.p2.restitution = 0.5;
    game.physics.p2.gravity.y = 0;
    game.physics.p2.friction = 0.9;
    teams[0] = new Team(0x0000ff,
        {x: INITIAL_GOAL_SIZE.WIDTH / 2, y: game.world.height / 2},
        {x: game.world.width / 4, y: game.world.height / 2},
        {x: game.world.width / 4, y: 0}
    );
    teams[1] = new Team(0xff0000,
        {x: game.world.width - INITIAL_GOAL_SIZE.WIDTH / 2, y: game.world.height / 2},
        {x: game.world.width * 3 / 4, y: game.world.height / 2},
        {x: game.world.width * 3 / 4, y: 0}
    );

    balls[0] = new Ball(game.world.width / 2, game.world.height / 2, 0xffffff);
    var slime_ball_contact = new Phaser.Physics.P2.ContactMaterial(material.slime, material.ball, {
        restitution: 0.75,
        stiffness: Number.MAX_VALUE,
        friction: 0.99
    });
    game.physics.p2.addContactMaterial(slime_ball_contact);
    postCreate();
}

var postCreate = function(){
    document.getElementById('pausePlay').onclick = function () {
        if (!game.stepping) {
            game.enableStep();
        }else{
            game.disableStep();
        }
    };
    document.getElementById('showXY').onclick = function () {
        printSlimeXY(0, 0);
        printSlimeXY(1, 0);
    };
    loadGUI();
};

var startGame = function (update) {
    game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {
        preload: preload,
        create: create,
        update: update
    }, false, false);
};

var timeStep = function(){
    return 1000/game.time.desiredFps;
};

var packageState = function () {
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

    var state = {};
    state.teams = [];
    for (var i = 0; i < teams.length; i++) {
        state.teams[i] = {};
        state.teams[i].score = teams[i].statCard.score;
        state.teams[i].slimes = [];
        for (var slimeNum = 0; slimeNum < teams[i].slimes.length; slimeNum++) {
            var localSlime = teams[i].slimes[slimeNum];
            state.teams[i].slimes[slimeNum] = packageBody(localSlime.body);
        }
    }
    state.balls = [];
    for (var g = 0; g < balls.length; g++) {
        state.balls[g] = packageBody(balls[g].body);
    }
    return state;
};

var loadNewState = function (state) {
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

    for (var i = 0; i < teams.length; i++) {
        teams[i].statCard.setScore(state.teams[i].score);
        for (var slimeNum = 0; slimeNum < teams[i].slimes.length; slimeNum++) {
            var localSlime = teams[i].slimes[slimeNum];
            var stateSlime = state.teams[i].slimes[slimeNum];
            loadBody(stateSlime, localSlime.body);
        }
    }
    for (var g = 0; g < balls.length; g++) {
        loadBody(state.balls[g], balls[g].body);
    }
};

var moveSlime = function (teamNum, slimeNum, inputSample) {
    teams[teamNum].slimes[slimeNum].move(inputSample);
};

var magnitudeXY = function (raw) {
    return Math.sqrt(Math.pow(raw.x, 2) + Math.pow(raw.y, 2));
}

var normaliseXY = function (raw) {
    var magnitude = magnitudeXY(raw);
    return {x: raw.x / magnitude, y: raw.y / magnitude};
}

var sampleInput = function (teamNum, slimeNum) {
    if (settings.useMouse) {
        return sampleMouse(teamNum, slimeNum);
    } else {
        return sampleKeyboard();
    }
};

var sampleMouse = function (teamNum, slimeNum) {
    var slime = teams[teamNum].slimes[slimeNum];
    var relativePoint = {x: slime.body.x, y: slime.body.y};
    var mousePointer = game.input.mousePointer;
    var mouse = game.input.mouse;
    if (mousePointer.isDown && mouse.button === Phaser.Mouse.LEFT_BUTTON) {
        var inputSample = new Float64Array(2);
        //extract a normalised direction from player to mouse
        var rawDiff = {x: mousePointer.worldX - relativePoint.x, y: mousePointer.worldY - relativePoint.y};
        var normalised = normaliseXY(rawDiff);
        inputSample[0] = normalised.x;
        inputSample[1] = normalised.y;
        inputSample[0] = Math.round(normalised.x * 100)/100;
        inputSample[1] = Math.round(normalised.y * 100)/100;
        return inputSample;
    } else {
        return null;
    }
};

var sampleKeyboard = function () {
    var inputSample = {up: false, down: false, left: false, right: false};
    Object.keys(controls).forEach(function (key) {
        if (controls[key].isDown) {
            inputSample[key] = true;
        }
    });
    if (inputSample.up || inputSample.down || inputSample.left || inputSample.right) {
        return inputSample;
    } else {
        return null;
    }
};

var manualUpdateHack = function () {
    //this is an internal (and therefor unsupported function)
    game.physics.p2.update();
};

var localUpdate = function () {
    if (goalScored) {
        onGoalReset();
        goalScored = false;
    }

    for (var ball of balls) {
        var magnitude = magnitudeXY(ball.body.velocity);
        var normalised = normaliseXY(ball.body.velocity);
        if (magnitude > ball.maxSpeed) {
            ball.body.velocity.x = ball.maxSpeed * normalised.x;
            ball.body.velocity.y = ball.maxSpeed * normalised.y;
        }
    }
};

var printSlimeXY = function(team, slime){
    var x = teams[team].slimes[slime].body.x;
    var y = teams[team].slimes[slime].body.y;
    console.log('team '+team+' slime '+slime+' x: '+x+' y: '+y);
};

//requires .timestamp, .inputSample, .slime, .team on inputElements
var fastForward = function(initialGameTime, inputElements, recordStateCallback){
    inputElements.sort((a,b) => a.timeStamp - b.timeStamp);
    var inputElement = 0;
    var simulatedTime = 0;
    console.log('time to make up in seconds: '+ (gameClock.now() - initialGameTime)/1000);
    while(initialGameTime + simulatedTime < gameClock.now()){
        simulatedTime += timeStep();
        var timeToMakeUp = gameClock.now() - (initialGameTime + simulatedTime);
        //extrapolating more then 100 steps is crazy, just give up (100*1/60=1.6seconds)
        if(timeToMakeUp > timeStep()*100){
           // break;
        }
        if(inputElement < inputElements.length && initialGameTime + simulatedTime > inputElements[inputElement].timeStamp){
            var inputToUse = inputElements[inputElement];
            inputElement++;
            moveSlime(inputToUse.team, inputToUse.slime, inputToUse.inputSample);
            localUpdate();
        }
        if(recordStateCallback) {
            recordStateCallback(packageState(), initialGameTime + simulatedTime);
        }
        manualUpdateHack();
    }
};

module.exports = {
    localUpdate: localUpdate,
    packageState: packageState,
    sampleInput: sampleInput,
    moveSlime: moveSlime,
    loadNewState: loadNewState,
    startGame: startGame,
    manualUpdateHack: manualUpdateHack,
    printSlimeXY: printSlimeXY,
    fastForward: fastForward,
    storeGui: storeGUI
};