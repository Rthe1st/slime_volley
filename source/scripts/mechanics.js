var game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {preload: preload, create:create, update:update}, false, false);

var material;

var teams = [];

var floor;

var balls = [];

var INITIAL_GOAL_SIZE = {HEIGHT: 100, WIDTH:50};

var goalScored = false;

function preload() {
}

//to do: make this a singleton
var Floor = function(){
    this.sprite = game.add.sprite();
    this.sprite.x = game.world.width/2;
    this.sprite.y = game.world.height;

//  Create our physics body.
    game.physics.p2.enable(this.sprite);
    this.sprite.body.static = true;
    //hack to get rid of a default rectangle, see if there's a better way
    this.sprite.body.setRectangle(0,0,0,0,0);
    this.sprite.body.addPlane(0,0,0);
    this.sprite.body.setMaterial(material.floor);
    this.sprite.body.debug = true;
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
    if(body === floor.sprite.body){
        if(this.sprite.body.force.y == this.sprite.body.mass * game.physics.p2.gravity.y){
            this.sprite.body.applyForce([0,700],this.sprite.body.x,this.sprite.body.y);
            return;
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
    this.maxSpeed = 300;
    var size = 28;
    this.sprite = game.add.sprite();
    this.sprite.name = name;
    this.sprite.x = x;
    this.sprite.y = y;
    this.initialJumpForce = 2000;
    this.jumpForce = this.initialJumpForce;
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

    this.sprite.body.onBeginContact.add(this.slimeHitFloor, this);
    
    this.sprite.body.debug = true;
};

Slime.prototype.slimeHitFloor = function(body, shapeA, shapeB, equation){
    if(body === floor.sprite.body){
        this.resetJumpForce();
    }
}

//note: replacing this with some kind of "fuel reserve" would probably make it more fun + intuitive
Slime.prototype.nextJumpForce = function(){
    this.jumpDecreaseRate += 50;
    this.jumpForce -= this.jumpDecreaseRate;
    if(this.jumpForce < 0){
        this.jumpForce = 0;
    }
    return this.jumpForce;
}

Slime.prototype.resetJumpForce = function(){
    this.jumpForce = this.initialJumpForce;
    this.jumpDecreaseRate = 0;
}

Slime.prototype.move = function(){
    var force = {x:0,y:0};
    var velocity = {x: this.sprite.body.velocity.x, y:this.sprite.body.velocity.y};
    if (this.controls.left.isDown)
    {
        force.x = 1000;
        if(this.sprite.body.velocity.x > 0){
            velocity.x /= 2;
        }
    }
    if (this.controls.right.isDown)
    {
        force.x = -1000;
        if(this.sprite.body.velocity.x < 0){
            velocity.x /= 2;
        }
    }
    if (this.controls.up.isDown)
    {
        force.y = this.nextJumpForce();
    }
    if (this.controls.down.isDown)
    {
        force.y = -game.physics.p2.gravity.y;
    }
    if(this.sprite.body.velocity.x > this.maxSpeed){
        velocity.x = this.maxSpeed;
    }else if(this.sprite.body.velocity.x < -this.maxSpeed){
         velocity.x = -this.maxSpeed;
    }
    this.sprite.body.moveRight(velocity.x);
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
        ball: new Phaser.Physics.P2.Material("BALL"),
        floor: new Phaser.Physics.P2.Material("FLOOR")
        };

    game.physics.p2.restitution = 0.5;
    game.physics.p2.gravity.y = 600;
    game.physics.p2.friction = 0.9;
    teams[0] = new Team(0x0000ff,
        {up:87, left:65, down: 83, right: 68},
        {x: INITIAL_GOAL_SIZE.WIDTH/2, y: game.world.height-INITIAL_GOAL_SIZE.HEIGHT/2},
        {x: game.world.width/4, y: game.world.height-150},
        {x: game.world.width/4, y: 0}
        );
    teams[1] = new Team(0xff0000,
        {up:38, left:37, down: 40, right: 39},
        {x: game.world.width-INITIAL_GOAL_SIZE.WIDTH/2, y: game.world.height-INITIAL_GOAL_SIZE.HEIGHT/2},
        {x: game.world.width*(3/4), y: game.world.height-150},
        {x: game.world.width*(3/4), y: 0}
        );
        
    floor = new Floor();

    balls[0] = new Ball(game.world.width/2, game.world.height/2, 0xffffff);
    var slime_ball_contact = new Phaser.Physics.P2.ContactMaterial(material.slime, material.ball, {restitution:0.75, stiffness : Number.MAX_VALUE, friction: 0.99});
    game.physics.p2.addContactMaterial(slime_ball_contact);
    var ball_floor_contact = new Phaser.Physics.P2.ContactMaterial(material.floor, material.ball, {
        restitution:0.5, stiffness : Number.MAX_VALUE});
    game.physics.p2.addContactMaterial(ball_floor_contact);
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