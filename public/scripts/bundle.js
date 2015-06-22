(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./clientSide.js":2,"./serverSide.js":3,"./shared.js":4}],2:[function(require,module,exports){
/*jslint browserify: true, devel: true*/
'use strict';

var shared = require('./shared.js');

var socket;

var serverState;
var acceptedInputSample;
var serverStateUpdated = false;
var unackInputSamples = [];
var sampleNum = 0;

var addSocketCallbacks = function(socket){
    socket.on(shared.messageTypes.playerJoined, function () {
        console.log('new player joined');
    });
    socket.on(shared.messageTypes.playerLeft, function () {
        console.log('player left');
    });
    socket.on('receive state', function (data) {
        serverState = data.state;
        serverStateUpdated = true;
        if(socket.isPlayer){
            acceptedInputSample = data.lastProcessedInput;
        }
    });
};

var unregisterSocket = function(socket){
    socket.removeListener(shared.messageTypes.playerJoined);
    socket.removeListener(shared.messageTypes.playerLeft);
    socket.removeListener('receive state');
}

var lame = 0;
var sendMove = function(inputSample, sampleNum){
    lame += 1;
    if(lame > 50){
        lame = 0;
        socket.emit('send move', {inputSample: inputSample, inputNum: sampleNum});
    }
};

var clientUpdate = function(sampleInput, loadNewState, moveSlime){
    if(!socket.isPlayer && serverStateUpdated){
        loadNewState(serverState);
        return;
    }
    //sending time stamps of how long controls held for good idea?
    //^^careful about phaser (maybe) having variable length frames
    var inputSample = sampleInput();
    //before processing new input, check for new server state and re-run stored inputSamples
    if(serverStateUpdated){
        loadNewState(serverState);
        //this wont work properly because we dont move time on appropiatly between actions?
        //crude method would be to call to <updateEngine> once per input duration in frames
        //(plus extra calls between input actions)
        unackInputSamples = unackInputSamples.slice(acceptedInputSample, unackInputSamples.length);
        for(var i=0;i<unackInputSamples.length;i++){
            moveSlime(module.exports.teamNum, module.exports.slimeNum, unackInputSamples[i]);
        }
    }
    //now process newest input
    var allfalse = !(inputSample.up || inputSample.down || inputSample.left || inputSample.right);
    if(!allfalse){
        unackInputSamples.push(inputSample);
        sendMove(inputSample, sampleNum);
    }
    sampleNum++;
    moveSlime(module.exports.teamNum, module.exports.slimeNum, inputSample);
};

module.exports = {
    registerSocket: function(socketRef, tTeamNum, tSlimeNum){
        socket = socketRef;
        module.exports.teamNum = tTeamNum;
        console.log('tTeamNum '+tTeamNum+' module.ex.teamNum '+module.exports.teamNum);
        module.exports.slimeNum = tSlimeNum;
        addSocketCallbacks(socket);
    },
    unregisterSocket: unregisterSocket,
    update: clientUpdate
};
},{"./shared.js":4}],3:[function(require,module,exports){
/*jslint browserify: true, devel: true */
'use strict';

var socket;
//CURRENTLY RELIES ON MESSAGES ARRIVING IN ORDER, IS GURANTEED?
//(yes if all sent over same tcp?)
var queuedClientInput = [[null],[null]];//includes team and slime for each input
var lastProcessedInputs = [[],[]];
var teamNum;
var slimeNum;
//serverSide.clients[0] = {team: team, slime: slime, inputSamples: []};

var addSocketCallbacks = function(socket){
    socket.on('receive move', function (data) {
        queuedClientInput[data.team][data.slime] = {inputSample: data.inputSample, inputNum: data.inputNum};
    });
};

var lame = 0;
var serverUpdate = function(moveSlime, packageState, localUpdate, sampleInput){
    for(var t=0;t<queuedClientInput.length; t++){
        for(var s=0;s<queuedClientInput[t].length;s++){
            var sample = queuedClientInput[t][s];
            if(sample == null){
                continue;
            }
            moveSlime(t, s, sample.inputSample);
            lastProcessedInputs[t][s] = sample.inputNum;
            queuedClientInput[t][s] = null;
        }
    }
    //also do for local slime
    //bad copy pasta till refactor
    moveSlime(0, 0, sampleInput());
    localUpdate();
    lame += 1;
    if(lame > 50){
        lame = 0;
        socket.emit('send state', {state: packageState(), lastProcessedInputs: lastProcessedInputs});
    }
};

module.exports = {
    registerSocket: function(socketRef, tTeamNum, tSlimeNum){
        socket = socketRef;
        teamNum = tTeamNum;
        slimeNum = tSlimeNum;
        console.log('register slimeNum '+slimeNum);
        console.log('register teamNum '+teamNum);
        addSocketCallbacks(socket);
    },
    update: serverUpdate
};
},{}],4:[function(require,module,exports){
/*jslint browserify: true */
'use strict';

exports.messageTypes = {playerSet: 'set player', playerJoined: 'player joined', playerLeft: 'player left', observerSet: 'observer set'};
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2Uvc2NyaXB0cy9tZWNoYW5pY3MuanMiLCJzb3VyY2Uvc2NyaXB0cy9jbGllbnRTaWRlLmpzIiwic291cmNlL3NjcmlwdHMvc2VydmVyU2lkZS5qcyIsInNvdXJjZS9zY3JpcHRzL3NoYXJlZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNsaW50IGJyb3dzZXI6IHRydWUsIGJyb3dzZXJpZnk6IHRydWUsIGRldmVsOiB0cnVlKi9cclxuLyogZ2xvYmFsIFBoYXNlciwgaW8qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc29ja2V0ID0gaW8uY29ubmVjdCgpO1xyXG5cclxudmFyIGNsaWVudFNpZGUgPSByZXF1aXJlKCcuL2NsaWVudFNpZGUuanMnKTtcclxudmFyIHNlcnZlclNpZGUgPSByZXF1aXJlKCcuL3NlcnZlclNpZGUuanMnKTtcclxudmFyIHNoYXJlZCA9IHJlcXVpcmUoJy4vc2hhcmVkLmpzJyk7XHJcblxyXG52YXIgbmV0d29ya1VwZGF0ZTtcclxuXHJcbnZhciBhdXRoO1xyXG5cclxudmFyIGdhbWU7XHJcblxyXG52YXIgbWF0ZXJpYWw7XHJcblxyXG52YXIgdGVhbXMgPSBbXTtcclxuXHJcbnZhciBiYWxscyA9IFtdO1xyXG5cclxudmFyIElOSVRJQUxfR09BTF9TSVpFID0ge0hFSUdIVDogMTAwLCBXSURUSDo1MH07XHJcblxyXG52YXIgZ29hbFNjb3JlZCA9IGZhbHNlO1xyXG5cclxudmFyIGNvbnRyb2xzO1xyXG5cclxuZnVuY3Rpb24gcHJlbG9hZCgpIHtcclxufVxyXG5cclxudmFyIEdvYWwgPSBmdW5jdGlvbih4LCB5LCBjb2xvcil7XHJcbiAgICB0aGlzLnNwcml0ZSA9IGdhbWUuYWRkLnNwcml0ZSgpO1xyXG4gICAgdGhpcy5zcHJpdGUueCA9IHg7XHJcbiAgICB0aGlzLnNwcml0ZS55ID0geTtcclxuXHJcbiAgICAvL2RyYXdpbmdcclxuICAgIHZhciBncmFwaGljID0gZ2FtZS5hZGQuZ3JhcGhpY3MoKTtcclxuICAgIGdyYXBoaWMuYmVnaW5GaWxsKGNvbG9yKTtcclxuICAgIGdyYXBoaWMuZHJhd1JlY3QoLUlOSVRJQUxfR09BTF9TSVpFLldJRFRILzIsLUlOSVRJQUxfR09BTF9TSVpFLkhFSUdIVC8yLCBJTklUSUFMX0dPQUxfU0laRS5XSURUSCwgSU5JVElBTF9HT0FMX1NJWkUuSEVJR0hUKTtcclxuICAgIHRoaXMuc3ByaXRlLmFkZENoaWxkKGdyYXBoaWMpO1xyXG5cclxuICAgIGdhbWUucGh5c2ljcy5wMi5lbmFibGUodGhpcy5zcHJpdGUpO1xyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5zdGF0aWMgPSB0cnVlO1xyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5zZXRSZWN0YW5nbGUoSU5JVElBTF9HT0FMX1NJWkUuV0lEVEgsSU5JVElBTF9HT0FMX1NJWkUuSEVJR0hULDAsMCwwKTtcclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuZGVidWcgPSB0cnVlO1xyXG5cclxufTtcclxuXHJcbnZhciBCYWxsID0gZnVuY3Rpb24oeCwgeSwgY29sb3Ipe1xyXG4gICAgdGhpcy5zdGFydENvcmRzID0ge3g6IHgseTogeX07XHJcbiAgICB0aGlzLm93bmVyID0gbnVsbDsvL3RoZSB0ZWFtIHRoYXQgbGFzdCB0b3VjaGVkIHRoZSBiYWxsXHJcbiAgICB2YXIgc2l6ZSA9IDEyO1xyXG4gICAgdGhpcy5zcHJpdGUgPSBnYW1lLmFkZC5zcHJpdGUoKTtcclxuICAgIHRoaXMuc3ByaXRlLnggPSB4O1xyXG4gICAgdGhpcy5zcHJpdGUueSA9IHk7XHJcbiAgICAvL25vdCBzdXJlIHdoYXQgdGhpcyBkb2VzLCBpZiB0aGUgZHJhd0NpcmNsZSBhbmQgYm9keSBjaXJjbGUgYXJlIGdpdmVuIHRoZSBzYW1lIHZhbHVlc1xyXG4gICAgLy90aGlzIGlzIG5lZWRlZCB0byBtYWtlIGNvbGxpc2lvbiBtYXRjaCB1cCAobWF5YmUgc2NhbGVzIGRyYXdpbmcgdG8gYm9keT8pXHJcbiAgICB0aGlzLnNwcml0ZS5zY2FsZS5zZXQoMik7XHJcblxyXG4gICAgLy9kcmF3aW5nXHJcbiAgICB2YXIgZ3JhcGhpYyA9IGdhbWUuYWRkLmdyYXBoaWNzKCk7XHJcbiAgICBncmFwaGljLmJlZ2luRmlsbChjb2xvcik7XHJcbiAgICBncmFwaGljLmRyYXdDaXJjbGUoMCwgMCwgc2l6ZSk7XHJcbiAgICB0aGlzLnNwcml0ZS5hZGRDaGlsZChncmFwaGljKTtcclxuXHJcbiAgICAvLyAgQ3JlYXRlIG91ciBwaHlzaWNzIGJvZHkuXHJcbiAgICBnYW1lLnBoeXNpY3MucDIuZW5hYmxlKHRoaXMuc3ByaXRlKTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LnNldENpcmNsZShzaXplKTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5Lm1hc3MgPSAyO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LnNldE1hdGVyaWFsKG1hdGVyaWFsLmJhbGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LmRlYnVnID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5Lm9uRW5kQ29udGFjdC5hZGQodGhpcy5lbmRDb250YWN0LCB0aGlzKTtcclxufTtcclxuXHJcbkJhbGwucHJvdG90eXBlLmVuZENvbnRhY3QgPSBmdW5jdGlvbihib2R5KSB7XHJcbiAgICAvL2NvdWxkIGJlIHNwZWQgdXAgYnkgY2hlY2tpbmcgdHlwZSBvZiBib2R5IGZpcnN0XHJcbiAgICBmb3IodmFyIGk9MDtpPHRlYW1zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGlmKGJvZHkgPT09IHRlYW1zW2ldLmdvYWwuc3ByaXRlLmJvZHkpe1xyXG4gICAgICAgICAgICBpZihpID09PSAwKXtcclxuICAgICAgICAgICAgICAgIHRlYW1zWzFdLnN0YXRDYXJkLmNoYW5nZVNjb3JlKDEsIHRydWUpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZihpID09PSAxKXtcclxuICAgICAgICAgICAgICAgIHRlYW1zWzBdLnN0YXRDYXJkLmNoYW5nZVNjb3JlKDEsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGdvYWxTY29yZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZvcih2YXIgc2xpbWVJbmRleD0wO3NsaW1lSW5kZXg8dGVhbXNbaV0uc2xpbWVzLmxlbmd0aDsgc2xpbWVJbmRleCsrKXtcclxuICAgICAgICAgICAgICAgIGlmKGJvZHkgPT09IHRlYW1zW2ldLnNsaW1lc1tzbGltZUluZGV4XS5zcHJpdGUuYm9keSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lciA9IHRlYW1zW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkJhbGwucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKXtcclxuICAgIGNvbnNvbGUubG9nKCdyZXNldCcpO1xyXG4gICAgdmFyIGJhbGxTcHJpdGUgPSB0aGlzLnNwcml0ZTtcclxuICAgIGJhbGxTcHJpdGUucmVzZXQodGhpcy5zdGFydENvcmRzLngsIHRoaXMuc3RhcnRDb3Jkcy55KTtcclxuICAgIGJhbGxTcHJpdGUuYm9keS5zZXRaZXJvUm90YXRpb24oKTtcclxuICAgIGJhbGxTcHJpdGUuYm9keS5zZXRaZXJvVmVsb2NpdHkoKTtcclxuICAgIGJhbGxTcHJpdGUuYm9keS5zZXRaZXJvRm9yY2UoKTtcclxuICAgIGJhbGxTcHJpdGUub3duZXIgPSBudWxsO1xyXG59O1xyXG5cclxudmFyIFNsaW1lID0gZnVuY3Rpb24gKHgsIHksIGNvbG9yKXtcclxuICAgIHRoaXMubWF4U3BlZWQgPSAyMDA7XHJcbiAgICB2YXIgc2l6ZSA9IDI4O1xyXG4gICAgdGhpcy5zcHJpdGUgPSBnYW1lLmFkZC5zcHJpdGUoKTtcclxuICAgIHRoaXMuc3ByaXRlLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy5zcHJpdGUueCA9IHg7XHJcbiAgICB0aGlzLnNwcml0ZS55ID0geTtcclxuICAgIC8vbm90IHN1cmUgd2hhdCB0aGlzIGRvZXMsIGlmIHRoZSBkcmF3Q2lyY2xlIGFuZCBib2R5IGNpcmNsZSBhcmUgZ2l2ZW4gdGhlIHNhbWUgdmFsdWVzXHJcbiAgICAvL3RoaXMgaXMgbmVlZGVkIHRvIG1ha2UgY29sbGlzaW9uIG1hdGNoIHVwIChtYXliZSBzY2FsZXMgZHJhd2luZyB0byBib2R5PylcclxuICAgIHRoaXMuc3ByaXRlLnNjYWxlLnNldCgyKTtcclxuXHJcbiAgICAvL2RyYXdpbmdcclxuICAgIHZhciBncmFwaGljID0gZ2FtZS5hZGQuZ3JhcGhpY3MoKTtcclxuICAgIGdyYXBoaWMuYmVnaW5GaWxsKGNvbG9yKTtcclxuICAgIGdyYXBoaWMuZHJhd0NpcmNsZSgwLCAwLCBzaXplKTtcclxuICAgIHRoaXMuc3ByaXRlLmFkZENoaWxkKGdyYXBoaWMpO1xyXG5cclxuICAgIC8vICBDcmVhdGUgb3VyIHBoeXNpY3MgYm9keS5cclxuICAgIGdhbWUucGh5c2ljcy5wMi5lbmFibGUodGhpcy5zcHJpdGUpO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuc2V0Q2lyY2xlKHNpemUpO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkubWFzcyA9IDEwO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LnNldE1hdGVyaWFsKG1hdGVyaWFsLnNsaW1lKTtcclxuICAgIFxyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5kZWJ1ZyA9IHRydWU7XHJcbn07XHJcblxyXG5TbGltZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKGlucHV0U2FtcGxlKXtcclxuICAgIHZhciBmb3JjZSA9IHt4OjAseTowfTtcclxuICAgIHZhciB2ZWxvY2l0eSA9IHt4OiB0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LngsIHk6dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55fTtcclxuICAgIHZhciBkaXJlY3Rpb25zID0geydMRUZUJzp7YXhpczoneCcsIHNjYWxpbmc6LTF9LCAnUklHSFQnOntheGlzOid4Jywgc2NhbGluZzoxfSwgJ1VQJzp7YXhpczoneScsIHNjYWxpbmc6LTF9LCAnRE9XTic6e2F4aXM6J3knLCBzY2FsaW5nOjF9fTtcclxuICAgIGZ1bmN0aW9uIG1vdmUoc2xpbWUsIGRpcmVjdGlvbil7XHJcbiAgICAgICAgLy8tMSBiZWNhdXNlIGZvcmNlIGF4ZXMgYXJlIGludmVydGVkIHZzIHZlbG9jaXR5IGF4ZXM/IT9cclxuICAgICAgICBmb3JjZVtkaXJlY3Rpb24uYXhpc10gPSAyMDAwKi0xKmRpcmVjdGlvbi5zY2FsaW5nO1xyXG4gICAgICAgIHZhciBkaXJlY3Rpb25NYXRjaGVzVmVsb2NpdHkgPSAoc2xpbWUuc3ByaXRlLmJvZHkudmVsb2NpdHlbZGlyZWN0aW9uLmF4aXNdICogZGlyZWN0aW9uLnNjYWxpbmcpIDwgMDtcclxuICAgICAgICBpZihkaXJlY3Rpb25NYXRjaGVzVmVsb2NpdHkpe1xyXG4gICAgICAgICAgICB2ZWxvY2l0eVtkaXJlY3Rpb24uYXhpc10gLz0gMztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoc2xpbWUuc3ByaXRlLmJvZHkudmVsb2NpdHlbZGlyZWN0aW9uLmF4aXNdID4gc2xpbWUubWF4U3BlZWQpe1xyXG4gICAgICAgICAgICB2ZWxvY2l0eVtkaXJlY3Rpb24uYXhpc10gPSBzbGltZS5tYXhTcGVlZDtcclxuICAgICAgICB9ZWxzZSBpZihzbGltZS5zcHJpdGUuYm9keS52ZWxvY2l0eVtkaXJlY3Rpb24uYXhpc10gPCAtc2xpbWUubWF4U3BlZWQpe1xyXG4gICAgICAgICAgICB2ZWxvY2l0eVtkaXJlY3Rpb24uYXhpc10gPSAtc2xpbWUubWF4U3BlZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoaW5wdXRTYW1wbGUuZG93bil7XHJcbiAgICAgICAgbW92ZSh0aGlzLCBkaXJlY3Rpb25zLkRPV04sIHZlbG9jaXR5LCBmb3JjZSk7XHJcbiAgICB9ZWxzZSBpZihpbnB1dFNhbXBsZS51cCl7XHJcbiAgICAgICAgbW92ZSh0aGlzLCBkaXJlY3Rpb25zLlVQLCB2ZWxvY2l0eSwgZm9yY2UpO1xyXG4gICAgfVxyXG4gICAgaWYoaW5wdXRTYW1wbGUubGVmdCl7XHJcbiAgICAgICAgbW92ZSh0aGlzLCBkaXJlY3Rpb25zLkxFRlQsIHZlbG9jaXR5LCBmb3JjZSk7XHJcbiAgICB9ZWxzZSBpZihpbnB1dFNhbXBsZS5yaWdodCl7XHJcbiAgICAgICAgbW92ZSh0aGlzLCBkaXJlY3Rpb25zLlJJR0hULCB2ZWxvY2l0eSwgZm9yY2UpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5tb3ZlUmlnaHQodmVsb2NpdHkueCk7XHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5Lm1vdmVEb3duKHZlbG9jaXR5LnkpO1xyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5hcHBseUZvcmNlKFtmb3JjZS54LCBmb3JjZS55XSwgdGhpcy5zcHJpdGUuYm9keS54LCB0aGlzLnNwcml0ZS5ib2R5LnkpO1xyXG59O1xyXG5cclxudmFyIFN0YXRDYXJkID0gZnVuY3Rpb24oY29yZHMsIHNjb3JlKXtcclxuICAgIHRoaXMueCA9IGNvcmRzLng7XHJcbiAgICB0aGlzLnkgPSBjb3Jkcy55O1xyXG4gICAgdGhpcy5zY29yZVRleHQgPSBnYW1lLmFkZC50ZXh0KHRoaXMueCwgdGhpcy55LCAnJywge2ZvbnQ6ICdib2xkIDIwcHQgQXJpYWwnLCBzdHJva2U6ICcjRkZGRkZGJywgc3Ryb2tlVGhpY2tuZXNzOiAxMH0pO1xyXG4gICAgdGhpcy5jaGFuZ2VTY29yZShzY29yZSwgZmFsc2UpO1xyXG59O1xyXG5cclxuLy9yZWxhdGl2ZSBpcyBhIGJvb2xlYW4sIGlmIGZhbHNlLCB2YWx1ZSBpcyBhZGRlZCB0byBjdXJyZW50IHNjb3JlXHJcblN0YXRDYXJkLnByb3RvdHlwZS5jaGFuZ2VTY29yZSA9IGZ1bmN0aW9uKHZhbHVlLCByZWxhdGl2ZSl7XHJcbiAgICBpZihyZWxhdGl2ZSl7XHJcbiAgICAgICAgdGhpcy5zY29yZSs9IHZhbHVlO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5zY29yZSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zY29yZVRleHQuc2V0VGV4dCgnU2NvcmU6ICcrdGhpcy5zY29yZSk7XHJcbn07XHJcblxyXG52YXIgVGVhbSA9IGZ1bmN0aW9uKGNvbG9yLCBnb2FsQ29yZHMsIHNsaW1lQ29yZHMsIHN0YXRDb3Jkcyl7XHJcbiAgICB0aGlzLnN0YXJ0U2xpbWVDb3JkcyA9IHNsaW1lQ29yZHM7XHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgICB0aGlzLmdvYWwgPSBuZXcgR29hbChnb2FsQ29yZHMueCwgZ29hbENvcmRzLnksIHRoaXMuY29sb3IpO1xyXG4gICAgdGhpcy5zbGltZXMgPSBbXTtcclxuICAgIHRoaXMuc2xpbWVzWzBdID0gbmV3IFNsaW1lKHNsaW1lQ29yZHMueCwgc2xpbWVDb3Jkcy55LCB0aGlzLmNvbG9yKTtcclxuICAgIHRoaXMuc3RhdENhcmQgPSBuZXcgU3RhdENhcmQoc3RhdENvcmRzLCAwKTtcclxufTtcclxuXHJcblRlYW0ucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXRUZWFtcygpe1xyXG4gICAgZm9yKHZhciBpPTA7IGkgPCB0aGlzLnNsaW1lcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgdmFyIHNsaW1lU3ByaXRlID0gdGhpcy5zbGltZXNbaV0uc3ByaXRlO1xyXG4gICAgICAgIHNsaW1lU3ByaXRlLmJvZHkuc2V0WmVyb1JvdGF0aW9uKCk7XHJcbiAgICAgICAgc2xpbWVTcHJpdGUuYm9keS5zZXRaZXJvVmVsb2NpdHkoKTtcclxuICAgICAgICBzbGltZVNwcml0ZS5ib2R5LnNldFplcm9Gb3JjZSgpO1xyXG4gICAgICAgIHNsaW1lU3ByaXRlLnJlc2V0KHRoaXMuc3RhcnRTbGltZUNvcmRzLngsIHRoaXMuc3RhcnRTbGltZUNvcmRzLnkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gb25Hb2FsUmVzZXQoKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGVhbXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGVhbXNbaV0ucmVzZXQoKTtcclxuICAgIH1cclxuICAgIGZvcih2YXIgZz0wO2c8YmFsbHMubGVuZ3RoO2crKyl7XHJcbiAgICAgICAgYmFsbHNbaV0ucmVzZXQoKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlKCkge1xyXG5cclxuICAgIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5QMkpTKTtcclxuXHJcbiAgICBjb250cm9scyA9IHtcclxuICAgICAgICAgICAgdXA6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KDg3KSwvL3dcclxuICAgICAgICAgICAgbGVmdDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoNjUpLC8vYVxyXG4gICAgICAgICAgICBkb3duOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleSg4MyksLy9zXHJcbiAgICAgICAgICAgIHJpZ2h0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleSg2OCkvL2RcclxuICAgIH07XHJcblxyXG4gICAgbWF0ZXJpYWwgPSB7XHJcbiAgICAgICAgc2xpbWU6IG5ldyBQaGFzZXIuUGh5c2ljcy5QMi5NYXRlcmlhbCgnU0xJTUUnKSxcclxuICAgICAgICBiYWxsOiBuZXcgUGhhc2VyLlBoeXNpY3MuUDIuTWF0ZXJpYWwoJ0JBTEwnKVxyXG4gICAgfTtcclxuXHJcbiAgICBnYW1lLnBoeXNpY3MucDIucmVzdGl0dXRpb24gPSAwLjU7XHJcbiAgICBnYW1lLnBoeXNpY3MucDIuZ3Jhdml0eS55ID0gMDtcclxuICAgIGdhbWUucGh5c2ljcy5wMi5mcmljdGlvbiA9IDAuOTtcclxuICAgIHRlYW1zWzBdID0gbmV3IFRlYW0oMHgwMDAwZmYsXHJcbiAgICAgICAge3g6IElOSVRJQUxfR09BTF9TSVpFLldJRFRILzIsIHk6IGdhbWUud29ybGQuaGVpZ2h0LzJ9LFxyXG4gICAgICAgIHt4OiBnYW1lLndvcmxkLndpZHRoLzQsIHk6IGdhbWUud29ybGQuaGVpZ2h0LzJ9LFxyXG4gICAgICAgIHt4OiBnYW1lLndvcmxkLndpZHRoLzQsIHk6IDB9XHJcbiAgICApO1xyXG4gICAgdGVhbXNbMV0gPSBuZXcgVGVhbSgweGZmMDAwMCxcclxuICAgICAgICB7eDogZ2FtZS53b3JsZC53aWR0aC1JTklUSUFMX0dPQUxfU0laRS5XSURUSC8yLCB5OiBnYW1lLndvcmxkLmhlaWdodC8yfSxcclxuICAgICAgICB7eDogZ2FtZS53b3JsZC53aWR0aCozLzQsIHk6IGdhbWUud29ybGQuaGVpZ2h0LzJ9LFxyXG4gICAgICAgIHt4OiBnYW1lLndvcmxkLndpZHRoKjMvNCwgeTogMH1cclxuICAgICk7XHJcblxyXG4gICAgYmFsbHNbMF0gPSBuZXcgQmFsbChnYW1lLndvcmxkLndpZHRoLzIsIGdhbWUud29ybGQuaGVpZ2h0LzIsIDB4ZmZmZmZmKTtcclxuICAgIHZhciBzbGltZV9iYWxsX2NvbnRhY3QgPSBuZXcgUGhhc2VyLlBoeXNpY3MuUDIuQ29udGFjdE1hdGVyaWFsKG1hdGVyaWFsLnNsaW1lLCBtYXRlcmlhbC5iYWxsLCB7cmVzdGl0dXRpb246MC43NSwgc3RpZmZuZXNzIDogTnVtYmVyLk1BWF9WQUxVRSwgZnJpY3Rpb246IDAuOTl9KTtcclxuICAgIGdhbWUucGh5c2ljcy5wMi5hZGRDb250YWN0TWF0ZXJpYWwoc2xpbWVfYmFsbF9jb250YWN0KTtcclxufVxyXG5cclxuc29ja2V0Lm9uKHNoYXJlZC5tZXNzYWdlVHlwZXMub2JzZXJ2ZXJTZXQsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKCdwbGF5ZXJzIGZ1bGwsIHlvdVxcJ3ZlIGJlZW4gcGxhY2VkIGluIHRoZSBvYnNlcnZlciBxdWV1ZScpO1xyXG4gICAgc29ja2V0LmlzUGxheWVyID0gZmFsc2U7XHJcbiAgICBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDgwMCwgNjAwLCBQaGFzZXIuQVVUTywgJyNwaGFzZXJfcGFyZW50Jywge3ByZWxvYWQ6IHByZWxvYWQsIGNyZWF0ZTpjcmVhdGUsIHVwZGF0ZTp1cGRhdGV9LCBmYWxzZSwgZmFsc2UpO1xyXG59KTtcclxuXHJcbnNvY2tldC5vbignc2V0IGF1dGgnLCBmdW5jdGlvbigpe1xyXG4gICAgY2xpZW50U2lkZS51bnJlZ2lzdGVyU29ja2V0KHNvY2tldCk7XHJcbiAgICBzZXJ2ZXJTaWRlLnJlZ2lzdGVyU29ja2V0KHNvY2tldCwgY2xpZW50U2lkZS50ZWFtTnVtLCBjbGllbnRTaWRlLnNsaW1lTnVtKTtcclxuICAgIG5ldHdvcmtVcGRhdGUgPSBzZXJ2ZXJTaWRlLnVwZGF0ZTtcclxuICAgIC8qcmVtb3ZlIGFsbCBjbGllbnQgYXV0aHMsIHZpYSBmdW5jdGlvbiBpbiBjbGllbnQgYXV0aD9cclxuICAgIHNvY2tldC5yZW1vdmVMaXN0ZW5lcihcIm5ld3NcIiwgY2JQcm94eSk7XHJcbiAgICAqL1xyXG59KTtcclxuXHJcbnNvY2tldC5vbihzaGFyZWQubWVzc2FnZVR5cGVzLnBsYXllclNldCwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgIHNvY2tldC5pc1BsYXllciA9IHRydWU7XHJcbiAgICB2YXIgdGVhbSA9IGRhdGEudGVhbTtcclxuICAgIHZhciBwbGF5ZXIgPSBkYXRhLnNsaW1lO1xyXG4gICAgYXV0aCA9IGRhdGEuYXV0aDtcclxuICAgIGNvbnNvbGUubG9nKCdhdXRoJyk7XHJcbiAgICBjb25zb2xlLmxvZygneW91XFwndmUgam9pbmVkIGFzIGEgcGxheWVyJyk7XHJcbiAgICAvL2NvdWxkIHRoaXMgdXNlIHNvY2tldCB2YXJpYWJsZXMgaW5zdGVhZD9cclxuICAgIGlmKGF1dGgpe1xyXG4gICAgICAgIHNlcnZlclNpZGUucmVnaXN0ZXJTb2NrZXQoc29ja2V0LCB0ZWFtLCBwbGF5ZXIpO1xyXG4gICAgICAgIG5ldHdvcmtVcGRhdGUgPSBzZXJ2ZXJTaWRlLnVwZGF0ZTtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIGNsaWVudFNpZGUucmVnaXN0ZXJTb2NrZXQoc29ja2V0LCB0ZWFtLCBwbGF5ZXIpO1xyXG4gICAgICAgIG5ldHdvcmtVcGRhdGUgPSBjbGllbnRTaWRlLnVwZGF0ZTtcclxuICAgIH1cclxuICAgIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA2MDAsIFBoYXNlci5BVVRPLCAnI3BoYXNlcl9wYXJlbnQnLCB7cHJlbG9hZDogcHJlbG9hZCwgY3JlYXRlOmNyZWF0ZSwgdXBkYXRlOnVwZGF0ZX0sIGZhbHNlLCBmYWxzZSk7XHJcbn0pO1xyXG5cclxudmFyIHBhY2thZ2VTdGF0ZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgc3RhdGUgPSB7fTtcclxuICAgIHN0YXRlLnRlYW1zID0gW107XHJcbiAgICBmb3IodmFyIGk9MDtpPHRlYW1zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGZvcih2YXIgc2xpbWVOdW09MDtzbGltZU51bTx0ZWFtc1tpXS5sZW5ndGg7c2xpbWVOdW0rKyl7XHJcbiAgICAgICAgICAgIC8vZm9yY2UgYW5kIHJvdGF0aW9uIHByb2JhbHkgbmVlZGVkIGFzIHdlbGxcclxuICAgICAgICAgICAgdmFyIGxvY2FsU2xpbWUgPSB0ZWFtc1tpXS5zbGltZXNbc2xpbWVOdW1dO1xyXG4gICAgICAgICAgICB2YXIgc3RhdGVTbGltZSA9IHN0YXRlLnRlYW1zW2ldLnNsaW1lc1tzbGltZU51bV07XHJcbiAgICAgICAgICAgIHN0YXRlU2xpbWUucG9zdGlvbiA9IHt4OmxvY2FsU2xpbWUuYm9keS54LCB5OmxvY2FsU2xpbWUuYm9keS55fTtcclxuICAgICAgICAgICAgc3RhdGVTbGltZS52ZWxvY2l0eSA9IHt4OiBsb2NhbFNsaW1lLmJvZHkudmVsb2NpdHkueCwgeTpsb2NhbFNsaW1lLmJvZHkudmVsb2NpdHkueX07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0YXRlO1xyXG59O1xyXG5cclxudmFyIGxvYWROZXdTdGF0ZSA9IGZ1bmN0aW9uKHN0YXRlKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGVhbXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgZm9yKHZhciBzbGltZU51bT0wO3NsaW1lTnVtPHRlYW1zW2ldLmxlbmd0aDtzbGltZU51bSsrKXtcclxuICAgICAgICAgICAgLy9mb3JjZSBhbmQgcm90YXRpb24gcHJvYmFseSBuZWVkZWQgYXMgd2VsbFxyXG4gICAgICAgICAgICB2YXIgbG9jYWxTbGltZSA9IHRlYW1zW2ldLnNsaW1lc1tzbGltZU51bV07XHJcbiAgICAgICAgICAgIHZhciBzdGF0ZVNsaW1lID0gc3RhdGUudGVhbXNbaV0uc2xpbWVzW3NsaW1lTnVtXTtcclxuICAgICAgICAgICAgbG9jYWxTbGltZS5ib2R5LnggPSBzdGF0ZVNsaW1lLnBvc3Rpb24ueDtcclxuICAgICAgICAgICAgbG9jYWxTbGltZS5ib2R5LnkgPSBzdGF0ZVNsaW1lLnBvc3Rpb24ueTtcclxuICAgICAgICAgICAgbG9jYWxTbGltZS5ib2R5LnZlbG9jaXR5LnggPSBzdGF0ZVNsaW1lLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgICAgIGxvY2FsU2xpbWUuYm9keS52ZWxvY2l0eS55ID0gc3RhdGVTbGltZS52ZWxvY2l0eS55O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbnZhciBtb3ZlU2xpbWUgPSBmdW5jdGlvbih0ZWFtTnVtLCBzbGltZU51bSwgaW5wdXRTYW1wbGUpe1xyXG4gICAgdGVhbXNbdGVhbU51bV0uc2xpbWVzW3NsaW1lTnVtXS5tb3ZlKGlucHV0U2FtcGxlKTtcclxufTtcclxuXHJcbnZhciBzYW1wbGVJbnB1dCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgaW5wdXRTYW1wbGUgPSB7dXA6ZmFsc2UsIGRvd246ZmFsc2UsIGxlZnQ6ZmFsc2UsIHJpZ2h0OmZhbHNlfTtcclxuICAgIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgICAgaWYoY29udHJvbHNba2V5XS5pc0Rvd24pe1xyXG4gICAgICAgICAgICBpbnB1dFNhbXBsZVtrZXldID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBpbnB1dFNhbXBsZTtcclxufTtcclxuXHJcbnZhciBsb2NhbFVwZGF0ZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZihnb2FsU2NvcmVkKXtcclxuICAgICAgICBvbkdvYWxSZXNldCgpO1xyXG4gICAgICAgIGdvYWxTY29yZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vZGlydHkgaGFjayB0byBzZWUgaWYgY3VycmVudCBzZXQgdXAgaXMgd29ya2luZ1xyXG4gICAgLy9zZXJ2ZXIgc2lkZSBjb2RlIGV4ZWN0dWVzIG1vdmUgc2xpbWUgZm9yIGV2ZXJ5IHJlY2lldmVkIGlucHV0IHNhbXBsZVxyXG4gICAgLy90aGlzIGNvZGUgc2hvdWxkIG9ubHkgZXhlY3V0ZSBtb3Zlc2xpbWUgb24gc2xpbWVzIHdpdGggbm8gcHJvY2Vzc2VkIGlucG91dCBzYW1wbGVcclxuICAgIC8vYnV0IHcvZSBmb3Igbm93XHJcbiAgICBmb3IodmFyIHQ9MDt0PHRlYW1zLmxlbmd0aDt0Kyspe1xyXG4gICAgICAgIGZvcih2YXIgcz0wO3M8dGVhbXNbdF0ubGVuZ3RoO3MrKyl7XHJcbiAgICAgICAgICAgIG1vdmVTbGltZSh0LCBzLCB7dXA6ZmFsc2UsIGRvd246ZmFsc2UsIGxlZnQ6ZmFsc2UsIHJpZ2h0OmZhbHNlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZSgpIHtcclxuICAgIC8vd2VsbCB0aGlzIGlzIGNyYXAsIGNsaWVudC9zZXJ2ZXIgdXBkYXRlcyB0YWtlIGRpZmZlcmVudCBjYWxsYmFja3NcclxuICAgIC8vcGFzcyBpbiBhbiBvYmplY3Qgb3Igc2V0IGNhbGxiYWNrcyBvbiByZWdpc3RyYXRpb24gdG8gYXZvaWRcclxuICAgIGlmKHNvY2tldC5pc1BsYXllcil7XHJcbiAgICAgICAgaWYoYXV0aCl7XHJcbiAgICAgICAgICAgIC8vc2FtcGxlIGlucGl1dCBpcyB0ZW1wLCB3b250IGJlIG5lZWRlZCBhZnRlciBsaWJhcmluZyBtZWNoYW5pY3MgZnJvbSBzZXJ2ZXJzaWRlXHJcbiAgICAgICAgICAgIG5ldHdvcmtVcGRhdGUobW92ZVNsaW1lLCBwYWNrYWdlU3RhdGUsIGxvY2FsVXBkYXRlLCBzYW1wbGVJbnB1dCk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIG5ldHdvcmtVcGRhdGUoc2FtcGxlSW5wdXQsIGxvYWROZXdTdGF0ZSwgbW92ZVNsaW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBjb25zb2xlLmxvZygnb2JzZXJldmVyIHVwZGF0ZSBjb2RlIG5vdCBpbXBsZW1lbnRlZCcpO1xyXG4gICAgfVxyXG59IiwiLypqc2xpbnQgYnJvd3NlcmlmeTogdHJ1ZSwgZGV2ZWw6IHRydWUqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc2hhcmVkID0gcmVxdWlyZSgnLi9zaGFyZWQuanMnKTtcclxuXHJcbnZhciBzb2NrZXQ7XHJcblxyXG52YXIgc2VydmVyU3RhdGU7XHJcbnZhciBhY2NlcHRlZElucHV0U2FtcGxlO1xyXG52YXIgc2VydmVyU3RhdGVVcGRhdGVkID0gZmFsc2U7XHJcbnZhciB1bmFja0lucHV0U2FtcGxlcyA9IFtdO1xyXG52YXIgc2FtcGxlTnVtID0gMDtcclxuXHJcbnZhciBhZGRTb2NrZXRDYWxsYmFja3MgPSBmdW5jdGlvbihzb2NrZXQpe1xyXG4gICAgc29ja2V0Lm9uKHNoYXJlZC5tZXNzYWdlVHlwZXMucGxheWVySm9pbmVkLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ25ldyBwbGF5ZXIgam9pbmVkJyk7XHJcbiAgICB9KTtcclxuICAgIHNvY2tldC5vbihzaGFyZWQubWVzc2FnZVR5cGVzLnBsYXllckxlZnQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygncGxheWVyIGxlZnQnKTtcclxuICAgIH0pO1xyXG4gICAgc29ja2V0Lm9uKCdyZWNlaXZlIHN0YXRlJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICBzZXJ2ZXJTdGF0ZSA9IGRhdGEuc3RhdGU7XHJcbiAgICAgICAgc2VydmVyU3RhdGVVcGRhdGVkID0gdHJ1ZTtcclxuICAgICAgICBpZihzb2NrZXQuaXNQbGF5ZXIpe1xyXG4gICAgICAgICAgICBhY2NlcHRlZElucHV0U2FtcGxlID0gZGF0YS5sYXN0UHJvY2Vzc2VkSW5wdXQ7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG52YXIgdW5yZWdpc3RlclNvY2tldCA9IGZ1bmN0aW9uKHNvY2tldCl7XHJcbiAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoc2hhcmVkLm1lc3NhZ2VUeXBlcy5wbGF5ZXJKb2luZWQpO1xyXG4gICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKHNoYXJlZC5tZXNzYWdlVHlwZXMucGxheWVyTGVmdCk7XHJcbiAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ3JlY2VpdmUgc3RhdGUnKTtcclxufVxyXG5cclxudmFyIGxhbWUgPSAwO1xyXG52YXIgc2VuZE1vdmUgPSBmdW5jdGlvbihpbnB1dFNhbXBsZSwgc2FtcGxlTnVtKXtcclxuICAgIGxhbWUgKz0gMTtcclxuICAgIGlmKGxhbWUgPiA1MCl7XHJcbiAgICAgICAgbGFtZSA9IDA7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoJ3NlbmQgbW92ZScsIHtpbnB1dFNhbXBsZTogaW5wdXRTYW1wbGUsIGlucHV0TnVtOiBzYW1wbGVOdW19KTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBjbGllbnRVcGRhdGUgPSBmdW5jdGlvbihzYW1wbGVJbnB1dCwgbG9hZE5ld1N0YXRlLCBtb3ZlU2xpbWUpe1xyXG4gICAgaWYoIXNvY2tldC5pc1BsYXllciAmJiBzZXJ2ZXJTdGF0ZVVwZGF0ZWQpe1xyXG4gICAgICAgIGxvYWROZXdTdGF0ZShzZXJ2ZXJTdGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy9zZW5kaW5nIHRpbWUgc3RhbXBzIG9mIGhvdyBsb25nIGNvbnRyb2xzIGhlbGQgZm9yIGdvb2QgaWRlYT9cclxuICAgIC8vXl5jYXJlZnVsIGFib3V0IHBoYXNlciAobWF5YmUpIGhhdmluZyB2YXJpYWJsZSBsZW5ndGggZnJhbWVzXHJcbiAgICB2YXIgaW5wdXRTYW1wbGUgPSBzYW1wbGVJbnB1dCgpO1xyXG4gICAgLy9iZWZvcmUgcHJvY2Vzc2luZyBuZXcgaW5wdXQsIGNoZWNrIGZvciBuZXcgc2VydmVyIHN0YXRlIGFuZCByZS1ydW4gc3RvcmVkIGlucHV0U2FtcGxlc1xyXG4gICAgaWYoc2VydmVyU3RhdGVVcGRhdGVkKXtcclxuICAgICAgICBsb2FkTmV3U3RhdGUoc2VydmVyU3RhdGUpO1xyXG4gICAgICAgIC8vdGhpcyB3b250IHdvcmsgcHJvcGVybHkgYmVjYXVzZSB3ZSBkb250IG1vdmUgdGltZSBvbiBhcHByb3BpYXRseSBiZXR3ZWVuIGFjdGlvbnM/XHJcbiAgICAgICAgLy9jcnVkZSBtZXRob2Qgd291bGQgYmUgdG8gY2FsbCB0byA8dXBkYXRlRW5naW5lPiBvbmNlIHBlciBpbnB1dCBkdXJhdGlvbiBpbiBmcmFtZXNcclxuICAgICAgICAvLyhwbHVzIGV4dHJhIGNhbGxzIGJldHdlZW4gaW5wdXQgYWN0aW9ucylcclxuICAgICAgICB1bmFja0lucHV0U2FtcGxlcyA9IHVuYWNrSW5wdXRTYW1wbGVzLnNsaWNlKGFjY2VwdGVkSW5wdXRTYW1wbGUsIHVuYWNrSW5wdXRTYW1wbGVzLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTx1bmFja0lucHV0U2FtcGxlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbW92ZVNsaW1lKG1vZHVsZS5leHBvcnRzLnRlYW1OdW0sIG1vZHVsZS5leHBvcnRzLnNsaW1lTnVtLCB1bmFja0lucHV0U2FtcGxlc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy9ub3cgcHJvY2VzcyBuZXdlc3QgaW5wdXRcclxuICAgIHZhciBhbGxmYWxzZSA9ICEoaW5wdXRTYW1wbGUudXAgfHwgaW5wdXRTYW1wbGUuZG93biB8fCBpbnB1dFNhbXBsZS5sZWZ0IHx8IGlucHV0U2FtcGxlLnJpZ2h0KTtcclxuICAgIGlmKCFhbGxmYWxzZSl7XHJcbiAgICAgICAgdW5hY2tJbnB1dFNhbXBsZXMucHVzaChpbnB1dFNhbXBsZSk7XHJcbiAgICAgICAgc2VuZE1vdmUoaW5wdXRTYW1wbGUsIHNhbXBsZU51bSk7XHJcbiAgICB9XHJcbiAgICBzYW1wbGVOdW0rKztcclxuICAgIG1vdmVTbGltZShtb2R1bGUuZXhwb3J0cy50ZWFtTnVtLCBtb2R1bGUuZXhwb3J0cy5zbGltZU51bSwgaW5wdXRTYW1wbGUpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZWdpc3RlclNvY2tldDogZnVuY3Rpb24oc29ja2V0UmVmLCB0VGVhbU51bSwgdFNsaW1lTnVtKXtcclxuICAgICAgICBzb2NrZXQgPSBzb2NrZXRSZWY7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMudGVhbU51bSA9IHRUZWFtTnVtO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCd0VGVhbU51bSAnK3RUZWFtTnVtKycgbW9kdWxlLmV4LnRlYW1OdW0gJyttb2R1bGUuZXhwb3J0cy50ZWFtTnVtKTtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cy5zbGltZU51bSA9IHRTbGltZU51bTtcclxuICAgICAgICBhZGRTb2NrZXRDYWxsYmFja3Moc29ja2V0KTtcclxuICAgIH0sXHJcbiAgICB1bnJlZ2lzdGVyU29ja2V0OiB1bnJlZ2lzdGVyU29ja2V0LFxyXG4gICAgdXBkYXRlOiBjbGllbnRVcGRhdGVcclxufTsiLCIvKmpzbGludCBicm93c2VyaWZ5OiB0cnVlLCBkZXZlbDogdHJ1ZSAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc29ja2V0O1xyXG4vL0NVUlJFTlRMWSBSRUxJRVMgT04gTUVTU0FHRVMgQVJSSVZJTkcgSU4gT1JERVIsIElTIEdVUkFOVEVFRD9cclxuLy8oeWVzIGlmIGFsbCBzZW50IG92ZXIgc2FtZSB0Y3A/KVxyXG52YXIgcXVldWVkQ2xpZW50SW5wdXQgPSBbW251bGxdLFtudWxsXV07Ly9pbmNsdWRlcyB0ZWFtIGFuZCBzbGltZSBmb3IgZWFjaCBpbnB1dFxyXG52YXIgbGFzdFByb2Nlc3NlZElucHV0cyA9IFtbXSxbXV07XHJcbnZhciB0ZWFtTnVtO1xyXG52YXIgc2xpbWVOdW07XHJcbi8vc2VydmVyU2lkZS5jbGllbnRzWzBdID0ge3RlYW06IHRlYW0sIHNsaW1lOiBzbGltZSwgaW5wdXRTYW1wbGVzOiBbXX07XHJcblxyXG52YXIgYWRkU29ja2V0Q2FsbGJhY2tzID0gZnVuY3Rpb24oc29ja2V0KXtcclxuICAgIHNvY2tldC5vbigncmVjZWl2ZSBtb3ZlJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICBxdWV1ZWRDbGllbnRJbnB1dFtkYXRhLnRlYW1dW2RhdGEuc2xpbWVdID0ge2lucHV0U2FtcGxlOiBkYXRhLmlucHV0U2FtcGxlLCBpbnB1dE51bTogZGF0YS5pbnB1dE51bX07XHJcbiAgICB9KTtcclxufTtcclxuXHJcbnZhciBsYW1lID0gMDtcclxudmFyIHNlcnZlclVwZGF0ZSA9IGZ1bmN0aW9uKG1vdmVTbGltZSwgcGFja2FnZVN0YXRlLCBsb2NhbFVwZGF0ZSwgc2FtcGxlSW5wdXQpe1xyXG4gICAgZm9yKHZhciB0PTA7dDxxdWV1ZWRDbGllbnRJbnB1dC5sZW5ndGg7IHQrKyl7XHJcbiAgICAgICAgZm9yKHZhciBzPTA7czxxdWV1ZWRDbGllbnRJbnB1dFt0XS5sZW5ndGg7cysrKXtcclxuICAgICAgICAgICAgdmFyIHNhbXBsZSA9IHF1ZXVlZENsaWVudElucHV0W3RdW3NdO1xyXG4gICAgICAgICAgICBpZihzYW1wbGUgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtb3ZlU2xpbWUodCwgcywgc2FtcGxlLmlucHV0U2FtcGxlKTtcclxuICAgICAgICAgICAgbGFzdFByb2Nlc3NlZElucHV0c1t0XVtzXSA9IHNhbXBsZS5pbnB1dE51bTtcclxuICAgICAgICAgICAgcXVldWVkQ2xpZW50SW5wdXRbdF1bc10gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vYWxzbyBkbyBmb3IgbG9jYWwgc2xpbWVcclxuICAgIC8vYmFkIGNvcHkgcGFzdGEgdGlsbCByZWZhY3RvclxyXG4gICAgbW92ZVNsaW1lKDAsIDAsIHNhbXBsZUlucHV0KCkpO1xyXG4gICAgbG9jYWxVcGRhdGUoKTtcclxuICAgIGxhbWUgKz0gMTtcclxuICAgIGlmKGxhbWUgPiA1MCl7XHJcbiAgICAgICAgbGFtZSA9IDA7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoJ3NlbmQgc3RhdGUnLCB7c3RhdGU6IHBhY2thZ2VTdGF0ZSgpLCBsYXN0UHJvY2Vzc2VkSW5wdXRzOiBsYXN0UHJvY2Vzc2VkSW5wdXRzfSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHJlZ2lzdGVyU29ja2V0OiBmdW5jdGlvbihzb2NrZXRSZWYsIHRUZWFtTnVtLCB0U2xpbWVOdW0pe1xyXG4gICAgICAgIHNvY2tldCA9IHNvY2tldFJlZjtcclxuICAgICAgICB0ZWFtTnVtID0gdFRlYW1OdW07XHJcbiAgICAgICAgc2xpbWVOdW0gPSB0U2xpbWVOdW07XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3JlZ2lzdGVyIHNsaW1lTnVtICcrc2xpbWVOdW0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdyZWdpc3RlciB0ZWFtTnVtICcrdGVhbU51bSk7XHJcbiAgICAgICAgYWRkU29ja2V0Q2FsbGJhY2tzKHNvY2tldCk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlOiBzZXJ2ZXJVcGRhdGVcclxufTsiLCIvKmpzbGludCBicm93c2VyaWZ5OiB0cnVlICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmV4cG9ydHMubWVzc2FnZVR5cGVzID0ge3BsYXllclNldDogJ3NldCBwbGF5ZXInLCBwbGF5ZXJKb2luZWQ6ICdwbGF5ZXIgam9pbmVkJywgcGxheWVyTGVmdDogJ3BsYXllciBsZWZ0Jywgb2JzZXJ2ZXJTZXQ6ICdvYnNlcnZlciBzZXQnfTsiXX0=
