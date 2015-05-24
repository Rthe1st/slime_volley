(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {preload: preload, create:create, update:update}, false, false);

var material;

var teams = [];

var balls = [];

var INITIAL_GOAL_SIZE = {HEIGHT: 100, WIDTH:50};

var goalScored = false;

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

Ball.prototype.endContact = function(body, shapeA, shapeB, equation) {
    //could be sped up by checking type of body first
    for(var i=0;i<teams.length;i++){
        if(body === teams[i].goal.sprite.body){
            if(i == 0){
                teams[1].statCard.changeScore(1, true);
            }else if(i == 1){
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
}

Ball.prototype.reset = function(){
    console.log("reset");
    var ballSprite = this.sprite;
    ballSprite.reset(this.startCords.x, this.startCords.y);
    ballSprite.body.setZeroRotation();
    ballSprite.body.setZeroVelocity();
    ballSprite.body.setZeroForce();
    ballSprite.owner = null;
}

var Slime = function (x, y, color, controls){
    this.controls = {
        up: game.input.keyboard.addKey(controls.up),
        left: game.input.keyboard.addKey(controls.left),
        down: game.input.keyboard.addKey(controls.down),
        right: game.input.keyboard.addKey(controls.right)
    };
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

Slime.prototype.move = function(){
    var force = {x:0,y:0};
    var velocity = {x: this.sprite.body.velocity.x, y:this.sprite.body.velocity.y};
    var directions = {"LEFT":{axis:"x", scaling:-1}, "RIGHT":{axis:"x", scaling:1}, "UP":{axis:"y", scaling:-1}, "DOWN":{axis:"y", scaling:1}};
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
    if(this.controls.down.isDown){
        move(this, directions.DOWN, velocity, force);
    }else if(this.controls.up.isDown){
        move(this, directions.UP, velocity, force);
    }
    if(this.controls.left.isDown){
        move(this, directions.LEFT, velocity, force);
    }else if(this.controls.right.isDown){
        move(this, directions.RIGHT, velocity, force);
    }
    this.sprite.body.moveRight(velocity.x);
    this.sprite.body.moveDown(velocity.y);
    this.sprite.body.applyForce([force.x, force.y], this.sprite.body.x, this.sprite.body.y);
};

var StatCard = function(cords, score){
    this.x = cords.x;
    this.y = cords.y;
    this.scoreText = game.add.text(this.x, this.y, "", {font: 'bold 20pt Arial', stroke: '#FFFFFF', strokeThickness: 10});
    this.changeScore(score, false);
}

//relative is a boolean, if false, value is added to current score
StatCard.prototype.changeScore = function(value, relative){
   if(relative){
        this.score+= value;
   }else{
       this.score = value;
   }
   this.scoreText.setText("Score: "+this.score);
}

var Team = function(color, controls, goalCords, slimeCords, statCords){
    this.startSlimeCords = slimeCords;
    this.color = color;
    this.controls = controls;
    this.goal = new Goal(goalCords.x, goalCords.y, this.color);
    this.slimes = [];
    this.slimes[0] = new Slime(slimeCords.x, slimeCords.y, this.color, this.controls);
    this.statCard = new StatCard(statCords, 0);
}

Team.prototype.reset = function resetTeams(){
    for(var i=0; i < this.slimes.length; i++){
        var slimeSprite = this.slimes[i].sprite;
        slimeSprite.body.setZeroRotation();
        slimeSprite.body.setZeroVelocity();
        slimeSprite.body.setZeroForce();
        slimeSprite.reset(this.startSlimeCords.x, this.startSlimeCords.y);
    }
}

function onGoalReset(){
    for(var i=0;i<teams.length;i++){
        teams[i].reset();
    }
    for(var i=0;i<balls.length;i++){
        balls[i].reset();
    }
}

function create() {

    game.physics.startSystem(Phaser.Physics.P2JS);

    material = {
        slime: new Phaser.Physics.P2.Material("SLIME"),
        ball: new Phaser.Physics.P2.Material("BALL")
        };

    game.physics.p2.restitution = 0.5;
    game.physics.p2.gravity.y = 0;
    game.physics.p2.friction = 0.9;
    teams[0] = new Team(0x0000ff,
        {up:87, left:65, down: 83, right: 68},
        {x: INITIAL_GOAL_SIZE.WIDTH/2, y: game.world.height/2},
        {x: game.world.width/4, y: game.world.height/2},
        {x: game.world.width/4, y: 0}
        );
    teams[1] = new Team(0xff0000,
        {up:38, left:37, down: 40, right: 39},
        {x: game.world.width-INITIAL_GOAL_SIZE.WIDTH/2, y: game.world.height/2},
        {x: game.world.width*(3/4), y: game.world.height/2},
        {x: game.world.width*(3/4), y: 0}
        );

    balls[0] = new Ball(game.world.width/2, game.world.height/2, 0xffffff);
    var slime_ball_contact = new Phaser.Physics.P2.ContactMaterial(material.slime, material.ball, {restitution:0.75, stiffness : Number.MAX_VALUE, friction: 0.99});
    game.physics.p2.addContactMaterial(slime_ball_contact);
}

function update() {
    for(var i=0;i<teams.length;i++){
        var currentTeam = teams[i];
        for(var slimeIndex = 0; slimeIndex < currentTeam.slimes.length; slimeIndex++){
            currentTeam.slimes[slimeIndex].move();
        }
    }
    if(goalScored){
        onGoalReset();
        goalScored = false;
    }
}
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2Uvc2NyaXB0cy9tZWNoYW5pY3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA2MDAsIFBoYXNlci5BVVRPLCAnI3BoYXNlcl9wYXJlbnQnLCB7cHJlbG9hZDogcHJlbG9hZCwgY3JlYXRlOmNyZWF0ZSwgdXBkYXRlOnVwZGF0ZX0sIGZhbHNlLCBmYWxzZSk7XHJcblxyXG52YXIgbWF0ZXJpYWw7XHJcblxyXG52YXIgdGVhbXMgPSBbXTtcclxuXHJcbnZhciBiYWxscyA9IFtdO1xyXG5cclxudmFyIElOSVRJQUxfR09BTF9TSVpFID0ge0hFSUdIVDogMTAwLCBXSURUSDo1MH07XHJcblxyXG52YXIgZ29hbFNjb3JlZCA9IGZhbHNlO1xyXG5cclxuZnVuY3Rpb24gcHJlbG9hZCgpIHtcclxufVxyXG5cclxudmFyIEdvYWwgPSBmdW5jdGlvbih4LCB5LCBjb2xvcil7XHJcbiAgICB0aGlzLnNwcml0ZSA9IGdhbWUuYWRkLnNwcml0ZSgpO1xyXG4gICAgdGhpcy5zcHJpdGUueCA9IHg7XHJcbiAgICB0aGlzLnNwcml0ZS55ID0geTtcclxuXHJcbiAgICAvL2RyYXdpbmdcclxuICAgIHZhciBncmFwaGljID0gZ2FtZS5hZGQuZ3JhcGhpY3MoKTtcclxuICAgIGdyYXBoaWMuYmVnaW5GaWxsKGNvbG9yKTtcclxuICAgIGdyYXBoaWMuZHJhd1JlY3QoLUlOSVRJQUxfR09BTF9TSVpFLldJRFRILzIsLUlOSVRJQUxfR09BTF9TSVpFLkhFSUdIVC8yLCBJTklUSUFMX0dPQUxfU0laRS5XSURUSCwgSU5JVElBTF9HT0FMX1NJWkUuSEVJR0hUKTtcclxuICAgIHRoaXMuc3ByaXRlLmFkZENoaWxkKGdyYXBoaWMpO1xyXG5cclxuICAgIGdhbWUucGh5c2ljcy5wMi5lbmFibGUodGhpcy5zcHJpdGUpO1xyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5zdGF0aWMgPSB0cnVlO1xyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5zZXRSZWN0YW5nbGUoSU5JVElBTF9HT0FMX1NJWkUuV0lEVEgsSU5JVElBTF9HT0FMX1NJWkUuSEVJR0hULDAsMCwwKTtcclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuZGVidWcgPSB0cnVlO1xyXG5cclxufTtcclxuXHJcbnZhciBCYWxsID0gZnVuY3Rpb24oeCwgeSwgY29sb3Ipe1xyXG4gICAgdGhpcy5zdGFydENvcmRzID0ge3g6IHgseTogeX07XHJcbiAgICB0aGlzLm93bmVyID0gbnVsbDsvL3RoZSB0ZWFtIHRoYXQgbGFzdCB0b3VjaGVkIHRoZSBiYWxsXHJcbiAgICB2YXIgc2l6ZSA9IDEyO1xyXG4gICAgdGhpcy5zcHJpdGUgPSBnYW1lLmFkZC5zcHJpdGUoKTtcclxuICAgIHRoaXMuc3ByaXRlLnggPSB4O1xyXG4gICAgdGhpcy5zcHJpdGUueSA9IHk7XHJcbiAgICAvL25vdCBzdXJlIHdoYXQgdGhpcyBkb2VzLCBpZiB0aGUgZHJhd0NpcmNsZSBhbmQgYm9keSBjaXJjbGUgYXJlIGdpdmVuIHRoZSBzYW1lIHZhbHVlc1xyXG4gICAgLy90aGlzIGlzIG5lZWRlZCB0byBtYWtlIGNvbGxpc2lvbiBtYXRjaCB1cCAobWF5YmUgc2NhbGVzIGRyYXdpbmcgdG8gYm9keT8pXHJcbiAgICB0aGlzLnNwcml0ZS5zY2FsZS5zZXQoMik7XHJcblxyXG4gICAgLy9kcmF3aW5nXHJcbiAgICB2YXIgZ3JhcGhpYyA9IGdhbWUuYWRkLmdyYXBoaWNzKCk7XHJcbiAgICBncmFwaGljLmJlZ2luRmlsbChjb2xvcik7XHJcbiAgICBncmFwaGljLmRyYXdDaXJjbGUoMCwgMCwgc2l6ZSk7XHJcbiAgICB0aGlzLnNwcml0ZS5hZGRDaGlsZChncmFwaGljKTtcclxuXHJcbiAgICAvLyAgQ3JlYXRlIG91ciBwaHlzaWNzIGJvZHkuXHJcbiAgICBnYW1lLnBoeXNpY3MucDIuZW5hYmxlKHRoaXMuc3ByaXRlKTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LnNldENpcmNsZShzaXplKTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5Lm1hc3MgPSAyO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LnNldE1hdGVyaWFsKG1hdGVyaWFsLmJhbGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LmRlYnVnID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5Lm9uRW5kQ29udGFjdC5hZGQodGhpcy5lbmRDb250YWN0LCB0aGlzKTtcclxufTtcclxuXHJcbkJhbGwucHJvdG90eXBlLmVuZENvbnRhY3QgPSBmdW5jdGlvbihib2R5LCBzaGFwZUEsIHNoYXBlQiwgZXF1YXRpb24pIHtcclxuICAgIC8vY291bGQgYmUgc3BlZCB1cCBieSBjaGVja2luZyB0eXBlIG9mIGJvZHkgZmlyc3RcclxuICAgIGZvcih2YXIgaT0wO2k8dGVhbXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgaWYoYm9keSA9PT0gdGVhbXNbaV0uZ29hbC5zcHJpdGUuYm9keSl7XHJcbiAgICAgICAgICAgIGlmKGkgPT0gMCl7XHJcbiAgICAgICAgICAgICAgICB0ZWFtc1sxXS5zdGF0Q2FyZC5jaGFuZ2VTY29yZSgxLCB0cnVlKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoaSA9PSAxKXtcclxuICAgICAgICAgICAgICAgIHRlYW1zWzBdLnN0YXRDYXJkLmNoYW5nZVNjb3JlKDEsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGdvYWxTY29yZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZvcih2YXIgc2xpbWVJbmRleD0wO3NsaW1lSW5kZXg8dGVhbXNbaV0uc2xpbWVzLmxlbmd0aDsgc2xpbWVJbmRleCsrKXtcclxuICAgICAgICAgICAgICAgIGlmKGJvZHkgPT09IHRlYW1zW2ldLnNsaW1lc1tzbGltZUluZGV4XS5zcHJpdGUuYm9keSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lciA9IHRlYW1zW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuQmFsbC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpe1xyXG4gICAgY29uc29sZS5sb2coXCJyZXNldFwiKTtcclxuICAgIHZhciBiYWxsU3ByaXRlID0gdGhpcy5zcHJpdGU7XHJcbiAgICBiYWxsU3ByaXRlLnJlc2V0KHRoaXMuc3RhcnRDb3Jkcy54LCB0aGlzLnN0YXJ0Q29yZHMueSk7XHJcbiAgICBiYWxsU3ByaXRlLmJvZHkuc2V0WmVyb1JvdGF0aW9uKCk7XHJcbiAgICBiYWxsU3ByaXRlLmJvZHkuc2V0WmVyb1ZlbG9jaXR5KCk7XHJcbiAgICBiYWxsU3ByaXRlLmJvZHkuc2V0WmVyb0ZvcmNlKCk7XHJcbiAgICBiYWxsU3ByaXRlLm93bmVyID0gbnVsbDtcclxufVxyXG5cclxudmFyIFNsaW1lID0gZnVuY3Rpb24gKHgsIHksIGNvbG9yLCBjb250cm9scyl7XHJcbiAgICB0aGlzLmNvbnRyb2xzID0ge1xyXG4gICAgICAgIHVwOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShjb250cm9scy51cCksXHJcbiAgICAgICAgbGVmdDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoY29udHJvbHMubGVmdCksXHJcbiAgICAgICAgZG93bjogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoY29udHJvbHMuZG93biksXHJcbiAgICAgICAgcmlnaHQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KGNvbnRyb2xzLnJpZ2h0KVxyXG4gICAgfTtcclxuICAgIHRoaXMubWF4U3BlZWQgPSAyMDA7XHJcbiAgICB2YXIgc2l6ZSA9IDI4O1xyXG4gICAgdGhpcy5zcHJpdGUgPSBnYW1lLmFkZC5zcHJpdGUoKTtcclxuICAgIHRoaXMuc3ByaXRlLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy5zcHJpdGUueCA9IHg7XHJcbiAgICB0aGlzLnNwcml0ZS55ID0geTtcclxuICAgIC8vbm90IHN1cmUgd2hhdCB0aGlzIGRvZXMsIGlmIHRoZSBkcmF3Q2lyY2xlIGFuZCBib2R5IGNpcmNsZSBhcmUgZ2l2ZW4gdGhlIHNhbWUgdmFsdWVzXHJcbiAgICAvL3RoaXMgaXMgbmVlZGVkIHRvIG1ha2UgY29sbGlzaW9uIG1hdGNoIHVwIChtYXliZSBzY2FsZXMgZHJhd2luZyB0byBib2R5PylcclxuICAgIHRoaXMuc3ByaXRlLnNjYWxlLnNldCgyKTtcclxuXHJcbiAgICAvL2RyYXdpbmdcclxuICAgIHZhciBncmFwaGljID0gZ2FtZS5hZGQuZ3JhcGhpY3MoKTtcclxuICAgIGdyYXBoaWMuYmVnaW5GaWxsKGNvbG9yKTtcclxuICAgIGdyYXBoaWMuZHJhd0NpcmNsZSgwLCAwLCBzaXplKTtcclxuICAgIHRoaXMuc3ByaXRlLmFkZENoaWxkKGdyYXBoaWMpO1xyXG5cclxuICAgIC8vICBDcmVhdGUgb3VyIHBoeXNpY3MgYm9keS5cclxuICAgIGdhbWUucGh5c2ljcy5wMi5lbmFibGUodGhpcy5zcHJpdGUpO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuc2V0Q2lyY2xlKHNpemUpO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkubWFzcyA9IDEwO1xyXG5cclxuICAgIHRoaXMuc3ByaXRlLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LnNldE1hdGVyaWFsKG1hdGVyaWFsLnNsaW1lKTtcclxuICAgIFxyXG4gICAgdGhpcy5zcHJpdGUuYm9keS5kZWJ1ZyA9IHRydWU7XHJcbn07XHJcblxyXG5TbGltZS5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgZm9yY2UgPSB7eDowLHk6MH07XHJcbiAgICB2YXIgdmVsb2NpdHkgPSB7eDogdGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54LCB5OnRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueX07XHJcbiAgICB2YXIgZGlyZWN0aW9ucyA9IHtcIkxFRlRcIjp7YXhpczpcInhcIiwgc2NhbGluZzotMX0sIFwiUklHSFRcIjp7YXhpczpcInhcIiwgc2NhbGluZzoxfSwgXCJVUFwiOntheGlzOlwieVwiLCBzY2FsaW5nOi0xfSwgXCJET1dOXCI6e2F4aXM6XCJ5XCIsIHNjYWxpbmc6MX19O1xyXG4gICAgZnVuY3Rpb24gbW92ZShzbGltZSwgZGlyZWN0aW9uKXtcclxuICAgICAgICAvLy0xIGJlY2F1c2UgZm9yY2UgYXhlcyBhcmUgaW52ZXJ0ZWQgdnMgdmVsb2NpdHkgYXhlcz8hP1xyXG4gICAgICAgIGZvcmNlW2RpcmVjdGlvbi5heGlzXSA9IDIwMDAqLTEqZGlyZWN0aW9uLnNjYWxpbmc7XHJcbiAgICAgICAgdmFyIGRpcmVjdGlvbk1hdGNoZXNWZWxvY2l0eSA9IChzbGltZS5zcHJpdGUuYm9keS52ZWxvY2l0eVtkaXJlY3Rpb24uYXhpc10gKiBkaXJlY3Rpb24uc2NhbGluZykgPCAwO1xyXG4gICAgICAgIGlmKGRpcmVjdGlvbk1hdGNoZXNWZWxvY2l0eSl7XHJcbiAgICAgICAgICAgIHZlbG9jaXR5W2RpcmVjdGlvbi5heGlzXSAvPSAzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihzbGltZS5zcHJpdGUuYm9keS52ZWxvY2l0eVtkaXJlY3Rpb24uYXhpc10gPiBzbGltZS5tYXhTcGVlZCl7XHJcbiAgICAgICAgICAgIHZlbG9jaXR5W2RpcmVjdGlvbi5heGlzXSA9IHNsaW1lLm1heFNwZWVkO1xyXG4gICAgICAgIH1lbHNlIGlmKHNsaW1lLnNwcml0ZS5ib2R5LnZlbG9jaXR5W2RpcmVjdGlvbi5heGlzXSA8IC1zbGltZS5tYXhTcGVlZCl7XHJcbiAgICAgICAgICAgIHZlbG9jaXR5W2RpcmVjdGlvbi5heGlzXSA9IC1zbGltZS5tYXhTcGVlZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZih0aGlzLmNvbnRyb2xzLmRvd24uaXNEb3duKXtcclxuICAgICAgICBtb3ZlKHRoaXMsIGRpcmVjdGlvbnMuRE9XTiwgdmVsb2NpdHksIGZvcmNlKTtcclxuICAgIH1lbHNlIGlmKHRoaXMuY29udHJvbHMudXAuaXNEb3duKXtcclxuICAgICAgICBtb3ZlKHRoaXMsIGRpcmVjdGlvbnMuVVAsIHZlbG9jaXR5LCBmb3JjZSk7XHJcbiAgICB9XHJcbiAgICBpZih0aGlzLmNvbnRyb2xzLmxlZnQuaXNEb3duKXtcclxuICAgICAgICBtb3ZlKHRoaXMsIGRpcmVjdGlvbnMuTEVGVCwgdmVsb2NpdHksIGZvcmNlKTtcclxuICAgIH1lbHNlIGlmKHRoaXMuY29udHJvbHMucmlnaHQuaXNEb3duKXtcclxuICAgICAgICBtb3ZlKHRoaXMsIGRpcmVjdGlvbnMuUklHSFQsIHZlbG9jaXR5LCBmb3JjZSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5Lm1vdmVSaWdodCh2ZWxvY2l0eS54KTtcclxuICAgIHRoaXMuc3ByaXRlLmJvZHkubW92ZURvd24odmVsb2NpdHkueSk7XHJcbiAgICB0aGlzLnNwcml0ZS5ib2R5LmFwcGx5Rm9yY2UoW2ZvcmNlLngsIGZvcmNlLnldLCB0aGlzLnNwcml0ZS5ib2R5LngsIHRoaXMuc3ByaXRlLmJvZHkueSk7XHJcbn07XHJcblxyXG52YXIgU3RhdENhcmQgPSBmdW5jdGlvbihjb3Jkcywgc2NvcmUpe1xyXG4gICAgdGhpcy54ID0gY29yZHMueDtcclxuICAgIHRoaXMueSA9IGNvcmRzLnk7XHJcbiAgICB0aGlzLnNjb3JlVGV4dCA9IGdhbWUuYWRkLnRleHQodGhpcy54LCB0aGlzLnksIFwiXCIsIHtmb250OiAnYm9sZCAyMHB0IEFyaWFsJywgc3Ryb2tlOiAnI0ZGRkZGRicsIHN0cm9rZVRoaWNrbmVzczogMTB9KTtcclxuICAgIHRoaXMuY2hhbmdlU2NvcmUoc2NvcmUsIGZhbHNlKTtcclxufVxyXG5cclxuLy9yZWxhdGl2ZSBpcyBhIGJvb2xlYW4sIGlmIGZhbHNlLCB2YWx1ZSBpcyBhZGRlZCB0byBjdXJyZW50IHNjb3JlXHJcblN0YXRDYXJkLnByb3RvdHlwZS5jaGFuZ2VTY29yZSA9IGZ1bmN0aW9uKHZhbHVlLCByZWxhdGl2ZSl7XHJcbiAgIGlmKHJlbGF0aXZlKXtcclxuICAgICAgICB0aGlzLnNjb3JlKz0gdmFsdWU7XHJcbiAgIH1lbHNle1xyXG4gICAgICAgdGhpcy5zY29yZSA9IHZhbHVlO1xyXG4gICB9XHJcbiAgIHRoaXMuc2NvcmVUZXh0LnNldFRleHQoXCJTY29yZTogXCIrdGhpcy5zY29yZSk7XHJcbn1cclxuXHJcbnZhciBUZWFtID0gZnVuY3Rpb24oY29sb3IsIGNvbnRyb2xzLCBnb2FsQ29yZHMsIHNsaW1lQ29yZHMsIHN0YXRDb3Jkcyl7XHJcbiAgICB0aGlzLnN0YXJ0U2xpbWVDb3JkcyA9IHNsaW1lQ29yZHM7XHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3I7XHJcbiAgICB0aGlzLmNvbnRyb2xzID0gY29udHJvbHM7XHJcbiAgICB0aGlzLmdvYWwgPSBuZXcgR29hbChnb2FsQ29yZHMueCwgZ29hbENvcmRzLnksIHRoaXMuY29sb3IpO1xyXG4gICAgdGhpcy5zbGltZXMgPSBbXTtcclxuICAgIHRoaXMuc2xpbWVzWzBdID0gbmV3IFNsaW1lKHNsaW1lQ29yZHMueCwgc2xpbWVDb3Jkcy55LCB0aGlzLmNvbG9yLCB0aGlzLmNvbnRyb2xzKTtcclxuICAgIHRoaXMuc3RhdENhcmQgPSBuZXcgU3RhdENhcmQoc3RhdENvcmRzLCAwKTtcclxufVxyXG5cclxuVGVhbS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiByZXNldFRlYW1zKCl7XHJcbiAgICBmb3IodmFyIGk9MDsgaSA8IHRoaXMuc2xpbWVzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICB2YXIgc2xpbWVTcHJpdGUgPSB0aGlzLnNsaW1lc1tpXS5zcHJpdGU7XHJcbiAgICAgICAgc2xpbWVTcHJpdGUuYm9keS5zZXRaZXJvUm90YXRpb24oKTtcclxuICAgICAgICBzbGltZVNwcml0ZS5ib2R5LnNldFplcm9WZWxvY2l0eSgpO1xyXG4gICAgICAgIHNsaW1lU3ByaXRlLmJvZHkuc2V0WmVyb0ZvcmNlKCk7XHJcbiAgICAgICAgc2xpbWVTcHJpdGUucmVzZXQodGhpcy5zdGFydFNsaW1lQ29yZHMueCwgdGhpcy5zdGFydFNsaW1lQ29yZHMueSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uR29hbFJlc2V0KCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRlYW1zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRlYW1zW2ldLnJlc2V0KCk7XHJcbiAgICB9XHJcbiAgICBmb3IodmFyIGk9MDtpPGJhbGxzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGJhbGxzW2ldLnJlc2V0KCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcclxuXHJcbiAgICBnYW1lLnBoeXNpY3Muc3RhcnRTeXN0ZW0oUGhhc2VyLlBoeXNpY3MuUDJKUyk7XHJcblxyXG4gICAgbWF0ZXJpYWwgPSB7XHJcbiAgICAgICAgc2xpbWU6IG5ldyBQaGFzZXIuUGh5c2ljcy5QMi5NYXRlcmlhbChcIlNMSU1FXCIpLFxyXG4gICAgICAgIGJhbGw6IG5ldyBQaGFzZXIuUGh5c2ljcy5QMi5NYXRlcmlhbChcIkJBTExcIilcclxuICAgICAgICB9O1xyXG5cclxuICAgIGdhbWUucGh5c2ljcy5wMi5yZXN0aXR1dGlvbiA9IDAuNTtcclxuICAgIGdhbWUucGh5c2ljcy5wMi5ncmF2aXR5LnkgPSAwO1xyXG4gICAgZ2FtZS5waHlzaWNzLnAyLmZyaWN0aW9uID0gMC45O1xyXG4gICAgdGVhbXNbMF0gPSBuZXcgVGVhbSgweDAwMDBmZixcclxuICAgICAgICB7dXA6ODcsIGxlZnQ6NjUsIGRvd246IDgzLCByaWdodDogNjh9LFxyXG4gICAgICAgIHt4OiBJTklUSUFMX0dPQUxfU0laRS5XSURUSC8yLCB5OiBnYW1lLndvcmxkLmhlaWdodC8yfSxcclxuICAgICAgICB7eDogZ2FtZS53b3JsZC53aWR0aC80LCB5OiBnYW1lLndvcmxkLmhlaWdodC8yfSxcclxuICAgICAgICB7eDogZ2FtZS53b3JsZC53aWR0aC80LCB5OiAwfVxyXG4gICAgICAgICk7XHJcbiAgICB0ZWFtc1sxXSA9IG5ldyBUZWFtKDB4ZmYwMDAwLFxyXG4gICAgICAgIHt1cDozOCwgbGVmdDozNywgZG93bjogNDAsIHJpZ2h0OiAzOX0sXHJcbiAgICAgICAge3g6IGdhbWUud29ybGQud2lkdGgtSU5JVElBTF9HT0FMX1NJWkUuV0lEVEgvMiwgeTogZ2FtZS53b3JsZC5oZWlnaHQvMn0sXHJcbiAgICAgICAge3g6IGdhbWUud29ybGQud2lkdGgqKDMvNCksIHk6IGdhbWUud29ybGQuaGVpZ2h0LzJ9LFxyXG4gICAgICAgIHt4OiBnYW1lLndvcmxkLndpZHRoKigzLzQpLCB5OiAwfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgYmFsbHNbMF0gPSBuZXcgQmFsbChnYW1lLndvcmxkLndpZHRoLzIsIGdhbWUud29ybGQuaGVpZ2h0LzIsIDB4ZmZmZmZmKTtcclxuICAgIHZhciBzbGltZV9iYWxsX2NvbnRhY3QgPSBuZXcgUGhhc2VyLlBoeXNpY3MuUDIuQ29udGFjdE1hdGVyaWFsKG1hdGVyaWFsLnNsaW1lLCBtYXRlcmlhbC5iYWxsLCB7cmVzdGl0dXRpb246MC43NSwgc3RpZmZuZXNzIDogTnVtYmVyLk1BWF9WQUxVRSwgZnJpY3Rpb246IDAuOTl9KTtcclxuICAgIGdhbWUucGh5c2ljcy5wMi5hZGRDb250YWN0TWF0ZXJpYWwoc2xpbWVfYmFsbF9jb250YWN0KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlKCkge1xyXG4gICAgZm9yKHZhciBpPTA7aTx0ZWFtcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgY3VycmVudFRlYW0gPSB0ZWFtc1tpXTtcclxuICAgICAgICBmb3IodmFyIHNsaW1lSW5kZXggPSAwOyBzbGltZUluZGV4IDwgY3VycmVudFRlYW0uc2xpbWVzLmxlbmd0aDsgc2xpbWVJbmRleCsrKXtcclxuICAgICAgICAgICAgY3VycmVudFRlYW0uc2xpbWVzW3NsaW1lSW5kZXhdLm1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihnb2FsU2NvcmVkKXtcclxuICAgICAgICBvbkdvYWxSZXNldCgpO1xyXG4gICAgICAgIGdvYWxTY29yZWQgPSBmYWxzZTtcclxuICAgIH1cclxufSJdfQ==
