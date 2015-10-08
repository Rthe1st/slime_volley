import hackedPhaser from 'hackedPhaser';

gameCreation
allowGraphics
allow of physics
world width and heigth
fps
(pending step ablility?)
//mechanics^^

game add object

//not needed as long as we pintch the signal code as well
physics events (end contact)

/*import * as phaserFramework from 'Phaser';

 var Phaser = phaserFramework.Phaser;*/

export default {
    //for phaser specific action (i.e. client side only) use phaser directly
    framework: hackedPhaser,
    allowGraphics: false,
    //else use functions below:
    startGame(create, update) {
        //prevent create having this set to PhaserWrapper
        this.gameInstance = new this.framework.Game(800, 600, Phaser.AUTO, '#phaser_parent', {
            create: create,
            update: update
        }, false, false);
    },
    get game(){
        return this.gameInstance;
    },
    worldSize(){
        return {width: this.game.world.width, height: this.game.world.height};
    },
    fps(){
        return this.gameInstance.time.desiredFps;
    },
    addGameObject(gameObject){
        this.gameInstance.add.existing(gameObject);
    },
    manualUpdate(){
        this.gameInstance.physics.p2.update();
    },
    Sprite: framework.Sprite
}
