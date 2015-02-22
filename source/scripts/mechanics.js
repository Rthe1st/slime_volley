var game = new Phaser.Game(800, 600, Phaser.AUTO, '#phaser_parent', {preload: preload, create:create, update:update}, false, false);

function preload() {
}

function create() {

    var slime = game.add.sprite();

    var slimeGraphic = game.add.graphics();

    //draw
    slimeGraphic.beginFill(0xffffff);
    slimeGraphic.drawRect(0, 0, 100, 20);
    slimeGraphic.x = slimeGraphic.width * 0.5;
    slimeGraphic.y = slimeGraphic.height * 0.5;
    slime.addChild(slimeGraphic);

    //physics
    game.physics.enable(slime, Phaser.Physics.ARCADE);
    slime.body.bounce.y = 0.2;
    slime.body.gravity.y = 300;
    slime.body.collideWorldBounds = true;

    game.physics.startSystem(Phaser.Physics.ARCADE);
}

function update() {
}