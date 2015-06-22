/*jslint browser: true, browserify: true, devel: true*/
/* global Phaser, io*/
'use strict';

var socket = io.connect();

var clientSide = require('./clientSide.js');
var serverSide = require('./serverSide.js');
var shared = require('./shared.js');

var networkUpdate;

var auth;

var game;

var material;

var teams = [];

var balls = [];

var INITIAL_GOAL_SIZE = {HEIGHT: 100, WIDTH:50};

var goalScored = false;

var controls;

function preload() {
}

var Goal = function(x, y, color){
    this.sprite = game.add.sprite();
    this.sprite.x = x;
    this.sprite.y = y;

    //drawing
    var graphic = game.add.graphics();
    graphic.beginFill(color);
    graphic.drawRect(-INITIAL_GOAL_SIZE.WIDTH/2,-INITIAL_GOAL_SIZE.HEIGHT/2, INITIAL_GOAL_SIZE.WIDTH, INITIAL_GOAL_SIZE.HEIGHT);
    this.sprite.addChild(graphic);

    game.physics.p2.enable(this.sprite);
    this.sprite.body.static = true;
    this.sprite.body.setRectangle(INITIAL_GOAL_SIZE.WIDTH,INITIAL_GOAL_SIZE.HEIGHT,0,0,0);
    this.sprite.body.debug = true;

};

var Ball = function(x, y, color){
    this.startCords = {x: x,y: y};
    this.owner = null;//the team that last touched the ball
    var size = 12;
    this.sprite = game.add.sprite();
    this.sprite.x = x;
    this.sprite.y = y;
    //not sure what this does, if the drawCircle and body circle are given the same values
    //this is needed to make collision match up (maybe scales drawing to body?)
    this.sprite.scale.set(2);

    //drawing
    var graphic = game.add.graphics();
    graphic.beginFill(color);
    graphic.drawCircle(0, 0, size);
    this.sprite.addChild(graphic);

    //  Create our physics body.
    game.physics.p2.enable(this.sprite);

    this.sprite.body.setCircle(size);

    this.sprite.body.mass = 2;

    this.sprite.body.collideWorldBounds = true;

    this.sprite.body.setMaterial(material.ball);
    
    this.sprite.body.debug = true;

    this.sprite.body.onEndContact.add(this.endContact, this);
};

Ball.prototype.endContact = function(body) {
    //could be sped up by checking type of body first
    for(var i=0;i<teams.length;i++){
        if(body === teams[i].goal.sprite.body){
            if(i === 0){
                teams[1].statCard.changeScore(1, true);
            }else if(i === 1){
                teams[0].statCard.changeScore(1, true);
            }
            goalScored = true;
            return;
        }else{
            for(var slimeIndex=0;slimeIndex<teams[i].slimes.length; slimeIndex++){
                if(body === teams[i].slimes[slimeIndex].sprite.body){
                    this.owner = teams[i];
                    return;
                }
            }
        }
    }
};

Ball.prototype.reset = function(){
    console.log('reset');
    var ballSprite = this.sprite;
    ballSprite.reset(this.startCords.x, this.startCords.y);
    ballSprite.body.setZeroRotation();
    ballSprite.body.setZeroVelocity();
    ballSprite.body.setZeroForce();
    ballSprite.owner = null;
};

var Slime = function (x, y, color){
    this.maxSpeed = 200;
    var size = 28;
    this.sprite = game.add.sprite();
    this.sprite.name = name;
    this.sprite.x = x;
    this.sprite.y = y;
    //not sure what this does, if the drawCircle and body circle are given the same values
    //this is needed to make collision match up (maybe scales drawing to body?)
    this.sprite.scale.set(2);

    //drawing
    var graphic = game.add.graphics();
    graphic.beginFill(color);
    graphic.drawCircle(0, 0, size);
    this.sprite.addChild(graphic);

    //  Create our physics body.
    game.physics.p2.enable(this.sprite);

    this.sprite.body.setCircle(size);

    this.sprite.body.mass = 10;

    this.sprite.body.collideWorldBounds = true;

    this.sprite.body.setMaterial(material.slime);
    
    this.sprite.body.debug = true;
};

Slime.prototype.move = function(inputSample){
    var force = {x:0,y:0};
    var velocity = {x: this.sprite.body.velocity.x, y:this.sprite.body.velocity.y};
    var directions = {'LEFT':{axis:'x', scaling:-1}, 'RIGHT':{axis:'x', scaling:1}, 'UP':{axis:'y', scaling:-1}, 'DOWN':{axis:'y', scaling:1}};
    function move(slime, direction){
        //-1 because force axes are inverted vs velocity axes?!?
        force[direction.axis] = 2000*-1*direction.scaling;
        var directionMatchesVelocity = (slime.sprite.body.velocity[direction.axis] * direction.scaling) < 0;
        if(directionMatchesVelocity){
            velocity[direction.axis] /= 3;
        }
        if(slime.sprite.body.velocity[direction.axis] > slime.maxSpeed){
            velocity[direction.axis] = slime.maxSpeed;
        }else if(slime.sprite.body.velocity[direction.axis] < -slime.maxSpeed){
            velocity[direction.axis] = -slime.maxSpeed;
        }
    }
    if(inputSample.down){
        move(this, directions.DOWN, velocity, force);
    }else if(inputSample.up){
        move(this, directions.UP, velocity, force);
    }
    if(inputSample.left){
        move(this, directions.LEFT, velocity, force);
    }else if(inputSample.right){
        move(this, directions.RIGHT, velocity, force);
    }
    this.sprite.body.moveRight(velocity.x);
    this.sprite.body.moveDown(velocity.y);
    this.sprite.body.applyForce([force.x, force.y], this.sprite.body.x, this.sprite.body.y);
};

var StatCard = function(cords, score){
    this.x = cords.x;
    this.y = cords.y;
    this.scoreText = game.add.text(this.x, this.y, '', {font: 'bold 20pt Arial', stroke: '#FFFFFF', strokeThickness: 10});
    this.changeScore(score, false);
};

//relative is a boolean, if false, value is added to current score
StatCard.prototype.changeScore = function(value, relative){
    if(relative){
        this.score+= value;
    }else{
        this.score = value;
    }
    this.scoreText.setText('Score: '+this.score);
};

var Team = function(color, goalCords, slimeCords, statCords){
    this.startSlimeCords = slimeCords;
    this.color = color;
    this.goal = new Goal(goalCords.x, goalCords.y, this.color);
    this.slimes = [];
    this.slimes[0] = new Slime(slimeCords.x, slimeCords.y, this.color);
    this.statCard = new StatCard(statCords, 0);
};

Team.prototype.reset = function resetTeams(){
    for(var i=0; i < this.slimes.length; i++){
        var slimeSprite = this.slimes[i].sprite;
        slimeSprite.body.setZeroRotation();
        slimeSprite.body.setZeroVelocity();
        slimeSprite.body.setZeroForce();
        slimeSprite.reset(this.startSlimeCords.x, this.startSlimeCords.y);
    }
};

function onGoalReset(){
    for(var i=0;i<teams.length;i++){
        teams[i].reset();
    }
    for(var g=0;g<balls.length;g++){
        balls[i].reset();
    }
}

function create() {

    game.physics.startSystem(Phaser.Physics.P2JS);

    controls = {
            up: game.input.keyboard.addKey(87),//w
            left: game.input.keyboard.addKey(65),//a
            down: game.input.keyboard.addKey(83),//s
            right: game.input.keyboard.addKey(68)//d
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
}

socket.on(shared.messageTypes.observerSet, function () {
    console.log('players full, you\'ve been placed in the observer queue');
    socket.isPlayer = false;
    game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {preload: preload, create:create, update:update}, false, false);
});

socket.on('set auth', function(){
    clientSide.unregisterSocket(socket);
    serverSide.registerSocket(socket, clientSide.teamNum, clientSide.slimeNum);
    networkUpdate = serverSide.update;
    /*remove all client auths, via function in client auth?
    socket.removeListener("news", cbProxy);
    */
});

socket.on(shared.messageTypes.playerSet, function (data) {
    socket.isPlayer = true;
    var team = data.team;
    var player = data.slime;
    auth = data.auth;
    console.log('auth');
    console.log('you\'ve joined as a player');
    //could this use socket variables instead?
    if(auth){
        serverSide.registerSocket(socket, team, player);
        networkUpdate = serverSide.update;
    }else{
        clientSide.registerSocket(socket, team, player);
        networkUpdate = clientSide.update;
    }
    game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {preload: preload, create:create, update:update}, false, false);
});

var packageState = function(){
    var state = {};
    state.teams = [];
    for(var i=0;i<teams.length;i++){
        for(var slimeNum=0;slimeNum<teams[i].length;slimeNum++){
            //force and rotation probaly needed as well
            var localSlime = teams[i].slimes[slimeNum];
            var stateSlime = state.teams[i].slimes[slimeNum];
            stateSlime.postion = {x:localSlime.body.x, y:localSlime.body.y};
            stateSlime.velocity = {x: localSlime.body.velocity.x, y:localSlime.body.velocity.y};
        }
    }
    return state;
};

var loadNewState = function(state){
    for(var i=0;i<teams.length;i++){
        for(var slimeNum=0;slimeNum<teams[i].length;slimeNum++){
            //force and rotation probaly needed as well
            var localSlime = teams[i].slimes[slimeNum];
            var stateSlime = state.teams[i].slimes[slimeNum];
            localSlime.body.x = stateSlime.postion.x;
            localSlime.body.y = stateSlime.postion.y;
            localSlime.body.velocity.x = stateSlime.velocity.x;
            localSlime.body.velocity.y = stateSlime.velocity.y;
        }
    }
};

var moveSlime = function(teamNum, slimeNum, inputSample){
    teams[teamNum].slimes[slimeNum].move(inputSample);
};

var sampleInput = function(){
    var inputSample = {up:false, down:false, left:false, right:false};
    Object.keys(controls).forEach(function(key){
        if(controls[key].isDown){
            inputSample[key] = true;
        }
    });
    return inputSample;
};

var localUpdate = function(){
    if(goalScored){
        onGoalReset();
        goalScored = false;
    }
    //dirty hack to see if current set up is working
    //server side code exectues move slime for every recieved input sample
    //this code should only execute moveslime on slimes with no processed inpout sample
    //but w/e for now
    for(var t=0;t<teams.length;t++){
        for(var s=0;s<teams[t].length;s++){
            moveSlime(t, s, {up:false, down:false, left:false, right:false});
        }
    }

};

function update() {
    //well this is crap, client/server updates take different callbacks
    //pass in an object or set callbacks on registration to avoid
    if(socket.isPlayer){
        if(auth){
            //sample inpiut is temp, wont be needed after libaring mechanics from serverside
            networkUpdate(moveSlime, packageState, localUpdate, sampleInput);
        }else{
            networkUpdate(sampleInput, loadNewState, moveSlime);
        }
    }else{
        console.log('obserever update code not implemented');
    }
}