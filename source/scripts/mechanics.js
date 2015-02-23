var game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {preload: preload, create:create, update:update}, false, false);

var team1 = {
    color: 0x0000ff,
    //movement keys WASD
    controls: {up:87, left:65, down: 83, right: 68}
}
var team2 = {
    color: 0xff0000,
    //movement arrow keys
    controls_2: {up:38, left:37, down: 40, right: 39}
}

var ball;

var INITIAL_GOAL_SIZE = {HEIGHT: 50, WIDTH:25};

function preload() {
}

var Goal = function(x, y, color){
    this.sprite = game.add.sprite();
    this.sprite.x = x;
    this.sprite.y = y;
    //not sure what this does, if the drawCircle and body circle are given the same values
    //this is needed to make collision match up (maybe scales drawing to body?)
    this.sprite.scale.set(2);

    //drawing
    var graphic = game.add.graphics();
    graphic.beginFill(color);
    graphic.drawRect(-INITIAL_GOAL_SIZE.WIDTH/2, -INITIAL_GOAL_SIZE.HEIGHT/2, INITIAL_GOAL_SIZE.WIDTH, INITIAL_GOAL_SIZE.HEIGHT);
    this.sprite.addChild(graphic);
};

var Ball = function(x, y, color){
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

    this.sprite.body.collideWorldBounds = true;

};

var Slime = function (x, y, color, controls){
    this.controls = {
        up: game.input.keyboard.addKey(controls.up),
        left: game.input.keyboard.addKey(controls.left),
        down: game.input.keyboard.addKey(controls.down),
        right: game.input.keyboard.addKey(controls.right)
    };
    var size = 28;
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

    this.sprite.body.collideWorldBounds = true;
};

Slime.prototype.move = function(){
    if (this.controls.left.isDown)
    {
        this.sprite.body.rotateLeft(1000);
    }
    else if (this.controls.right.isDown)
    {
        this.sprite.body.rotateRight(1000);
    }
    else if (this.controls.up.isDown)
    {
        this.sprite.body.velocity.y = -200;
    }
};

function create() {

    game.physics.startSystem(Phaser.Physics.P2JS);

    game.physics.p2.restitution = 0.5;
    game.physics.p2.gravity.y = 300;

    team1.slime = new Slime(game.world.width/4, game.world.height, team1.color, team1.controls);
    team2.slime = new Slime(game.world.width*(3/4), game.world.height, team2.color, team2.controls_2);
    team1.goal = new Goal(INITIAL_GOAL_SIZE.WIDTH, game.world.height-INITIAL_GOAL_SIZE.HEIGHT, team1.color);
    team2.goal = new Goal(game.world.width-INITIAL_GOAL_SIZE.WIDTH, game.world.height-INITIAL_GOAL_SIZE.HEIGHT, team2.color);

    ball = new Ball(game.world.width/2, game.world.height/2, 0xffffff);
}
function update() {
    team1.slime.move();
    team2.slime.move();
}