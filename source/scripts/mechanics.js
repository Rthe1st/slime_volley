/*jslint browser: true, browserify: true, devel: true*/
/* global Phaser, io*/
'use strict';

var devHacks = function(){
    for(var team of teams){
        for(var slime of team.slimes){
            slime.maxSpeed = Number(document.getElementById('maxSpeed').value);
            slime.breakingRate = Number(document.getElementById('breakingRate').value);
            slime.moveForce = Number(document.getElementById('moveForce').value);
            slime.body.mass = Number(document.getElementById('slimeMass').value);
        }
    }
    for(var ball of balls){
        ball.maxSpeed = Number(document.getElementById('ballMaxSpeed').value);
        ball.body.mass = Number(document.getElementById('ballMass').value);
    }
    useMouse = "true" === document.getElementById('useMouse').value;
};

var devHacksSet = function(){
    document.getElementById('maxSpeed').value = teams[0].slimes[0].maxSpeed;
    document.getElementById('breakingRate').value = teams[0].slimes[0].breakingRate;
    document.getElementById('moveForce').value = teams[0].slimes[0].moveForce;
    document.getElementById('slimeMass').value = teams[0].slimes[0].body.mass;
    document.getElementById('ballMaxSpeed').value = balls[0].maxSpeed;
    document.getElementById('ballMass').value = balls[0].body.mass;
    document.getElementById('useMouse').value = useMouse;
};

var auth;

var game;

var material;

var teams = [];

var balls = [];

var INITIAL_GOAL_SIZE = {HEIGHT: 100, WIDTH:50};

var goalScored = false;

var controls;

var useMouse = true;

function preload() {
}

class Goal extends Phaser.Sprite{
    constructor(x, y, color){
        super(game, x, y);
        this.name = 'goal';

        var graphic = game.add.graphics();
        graphic.beginFill(color);
        graphic.drawRect(-INITIAL_GOAL_SIZE.WIDTH/2,-INITIAL_GOAL_SIZE.HEIGHT/2, INITIAL_GOAL_SIZE.WIDTH, INITIAL_GOAL_SIZE.HEIGHT);
        this.addChild(graphic);

        game.physics.p2.enable(this);
        this.body.static = true;
        this.body.setRectangle(INITIAL_GOAL_SIZE.WIDTH,INITIAL_GOAL_SIZE.HEIGHT,0,0,0);
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
        for(var i=0;i<teams.length;i++){
            //consider disallowing this client side, so score only changes when confirmed by server
            if(body === teams[i].goal.body){
                if(i === 0){
                    teams[1].statCard.changeScore(1);
                }else if(i === 1){
                    teams[0].statCard.changeScore(1);
                }
                goalScored = true;
                return;
            }else{
                for(var slimeIndex=0;slimeIndex<teams[i].slimes.length; slimeIndex++){
                    if(body === teams[i].slimes[slimeIndex].body){
                        this.owner = teams[i];
                        return;
                    }
                }
            }
        }
    }

    reset(){
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

    move(inputSample){
        if(useMouse){
            this.mouseMove(inputSample);
        }else{
            this.keyboardMove(inputSample);
        }
    }

    keyboardMove(inputSample){
        var force = {x:0,y:0};
        var velocity = {x: this.body.velocity.x, y:this.body.velocity.y};
        var directions = {'LEFT':{axis:'x', scaling:-1}, 'RIGHT':{axis:'x', scaling:1}, 'UP':{axis:'y', scaling:-1}, 'DOWN':{axis:'y', scaling:1}};
        function move(slime, direction){
            //-1 because force axes are inverted vs velocity axes?!?
            force[direction.axis] = 2000*-1*direction.scaling;
            var directionMatchesVelocity = (slime.body.velocity[direction.axis] * direction.scaling) < 0;
            if(directionMatchesVelocity){
                velocity[direction.axis] /= 3;
            }
            if(slime.body.velocity[direction.axis] > slime.maxSpeed){
                velocity[direction.axis] = slime.maxSpeed;
            }else if(slime.body.velocity[direction.axis] < -slime.maxSpeed){
                velocity[direction.axis] = -slime.maxSpeed;
            }
        }
        if(inputSample.down){
            move(this, directions.DOWN);
        }else if(inputSample.up){
            move(this, directions.UP);
        }
        if(inputSample.left){
            move(this, directions.LEFT);
        }else if(inputSample.right){
            move(this, directions.RIGHT);
        }
        this.body.moveRight(velocity.x);
        this.body.moveDown(velocity.y);
        this.body.applyForce([force.x, force.y], this.body.x, this.body.y);

    }

    mouseMove(inputSample){
        var force = {x:0,y:0};
        var velocity = {x: this.body.velocity.x, y:this.body.velocity.y};
        var mouseDirection = inputSample.direction;
        function move(slime, axis) {
            //-1 because force axes are inverted vs velocity axes?!?
            force[axis] = slime.moveForce * -1 * mouseDirection[axis];
            var directionMatchesVelocity = (slime.body.velocity[axis] * mouseDirection[axis]) < 0;
            if (directionMatchesVelocity) {
                velocity[axis] *= slime.breakingRate;
            }
        }
        function limit(slime){
            var slimeVelocity = slime.body.velocity;
            var magnitude = magnitudeXY(slimeVelocity);
            var normalised = normaliseXY(slimeVelocity);
            if(magnitude > slime.maxSpeed){
                slimeVelocity.x = slime.maxSpeed * normalised.x;
                slimeVelocity.y = slime.maxSpeed * normalised.y;
            }
        }
        move(this, 'x');
        move(this, 'y');
        this.body.moveRight(velocity.x);
        this.body.moveDown(velocity.y);
        this.body.applyForce([force.x, force.y], this.body.x, this.body.y);
        limit(this);
    }
}

class StatCard{
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

    setScore(value){
        this.score = value;
        this.scoreText.setText('Score: '+this.score);
    }

    //relative is a boolean, if false, value is added to current score
    changeScore(value){
        this.score+= value;
        this.scoreText.setText('Score: '+this.score);
    }
}

class Team{
    constructor(color, goalCords, slimeCords, statCords){
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

function onGoalReset(){
    for(var i=0;i<teams.length;i++){
        teams[i].reset();
    }
    for(var g=0;g<balls.length;g++){
        balls[g].reset();
    }
}

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
        {x: INITIAL_GOAL_SIZE.WIDTH/2, y: game.world.height/2},
        {x: game.world.width/4, y: game.world.height/2},
        {x: game.world.width/4, y: 0}
    );
    teams[1] = new Team(0xff0000,
        {x: game.world.width-INITIAL_GOAL_SIZE.WIDTH/2, y: game.world.height/2},
        {x: game.world.width*3/4, y: game.world.height/2},
        {x: game.world.width*3/4, y: 0}
    );

    balls[0] = new Ball(game.world.width/2, game.world.height/2, 0xffffff);
    var slime_ball_contact = new Phaser.Physics.P2.ContactMaterial(material.slime, material.ball, {restitution:0.75, stiffness : Number.MAX_VALUE, friction: 0.99});
    game.physics.p2.addContactMaterial(slime_ball_contact);
    devHacksSet();
    document.getElementById('setHacks').onclick = devHacks;
}

var startGame = function(update){
    game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {preload: preload, create:create, update:update}, false, false);
};

var packageState = function(){
    function packageBody(body){
        //rotation and rotation velocity needed as well
        //(as soon as players/balls are non-symentrical/non-circles)
        var bodyData = {};
        bodyData.position = {x:body.x, y:body.y};
        bodyData.velocity = {x: body.velocity.x, y:body.velocity.y};
        return bodyData;
    }
    var state = {};
    state.teams = [];
    for(var i=0;i<teams.length;i++){
        state.teams[i] = {};
        state.teams[i].score = teams[i].statCard.score;
        state.teams[i].slimes = [];
        for(var slimeNum=0;slimeNum<teams[i].slimes.length;slimeNum++){
            var localSlime = teams[i].slimes[slimeNum];
            state.teams[i].slimes[slimeNum] = packageBody(localSlime.body);
        }
    }
    state.balls = [];
    for(var g=0;g<balls.length;g++){
        state.balls[g] = packageBody(balls[g].body);
    }
    return state;
};

var loadNewState = function(state){
    function loadBody(bodyData, body){
        //rotation and rotation velocity needed as well
        //(as soon as players/balls are non-symentrical/non-circles)
        body.x = bodyData.position.x;
        body.y = bodyData.position.y;
        body.velocity.x = bodyData.velocity.x;
        body.velocity.y = bodyData.velocity.y;
    }
    for(var i=0;i<teams.length;i++){
        teams[i].statCard.setScore(state.teams[i].score);
        for(var slimeNum=0;slimeNum<teams[i].slimes.length;slimeNum++){
            var localSlime = teams[i].slimes[slimeNum];
            var stateSlime = state.teams[i].slimes[slimeNum];
            loadBody(stateSlime, localSlime.body);
        }
    }
    for(var g=0;g<balls.length;g++){
        loadBody(state.balls[g], balls[g].body);
    }
};

var moveSlime = function(teamNum, slimeNum, inputSample){
    teams[teamNum].slimes[slimeNum].move(inputSample);
};

var magnitudeXY = function(raw){
    return Math.sqrt(Math.pow(raw.x, 2)+Math.pow(raw.y, 2));
}

var normaliseXY = function(raw){
    var magnitude = magnitudeXY(raw);
    return {x:raw.x/magnitude, y:raw.y/magnitude};
}

var sampleInput = function(teamNum, slimeNum){
    var slime = teams[teamNum].slimes[slimeNum];
    var relativePoint = {x: slime.x, y: slime.y};
    var inputSample;
    var mousePointer = game.input.mousePointer;
    var mouse = game.input.mouse;
    if(useMouse && mousePointer.isDown && mouse.button === Phaser.Mouse.LEFT_BUTTON){
        inputSample = {};
        //extract a normalised direction from player to mouse
        var rawDiff = {x:mousePointer.worldX-relativePoint.x, y:mousePointer.worldY-relativePoint.y};
        inputSample.direction = normaliseXY(rawDiff);
        inputSample.direction.x = Math.round(inputSample.direction.x);
        inputSample.direction.y = Math.round(inputSample.direction.y);
    }else if(!useMouse) {
        inputSample = {up: false, down: false, left: false, right: false};
        Object.keys(controls).forEach(function (key) {
            if (controls[key].isDown) {
                inputSample[key] = true;
            }
        });
    }else{
        inputSample = null;
    }
    return inputSample;
};

var localUpdate = function(playerInfo, inputSample){
    if(arguments.length < 2){
        inputSample = sampleInput(playerInfo.team, playerInfo.slime);
        if(inputSample !== null) {
            moveSlime(playerInfo.team, playerInfo.slime, inputSample);
        }
    }
    if(goalScored){
        onGoalReset();
        goalScored = false;
    }

    for(var ball of balls) {
        var magnitude = magnitudeXY(ball.body.velocity);
        var normalised = normaliseXY(ball.body.velocity);
        if (magnitude > ball.maxSpeed) {
            ball.body.velocity.x = ball.maxSpeed * normalised.x;
            ball.body.velocity.y = ball.maxSpeed * normalised.y;
        }
    }
};

module.exports = {
    localUpdate: localUpdate,
    packageState: packageState,
    sampleInput: sampleInput,
    moveSlime: moveSlime,
    loadNewState: loadNewState,
    startGame: startGame
};