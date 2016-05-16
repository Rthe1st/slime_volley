/*jslint browser: true, browserify: true, devel: true*/
'use strict';

import {settings} from './mechanics.js';
import phaserWrapper from '../libaryWrappers/phaserWrapper.js';


//extend framework .sprite instead?
export default class extends phaserWrapper.Sprite {
    constructor(x, y, color, initialSize, mechanics) {
        super(mechanics.PhaserWrapper.game, x, y);
        this.name = 'goal';

        this.game.physics.p2.enable(this, settings.debug);
        this.body.static = true;
        this.body.setRectangle(initialSize.width, initialSize.height, 0, 0, 0);

        if(settings.frontEnd){
            var graphic = this.game.add.graphics();
            graphic.beginFill(color);
            graphic.drawRect(-initialSize.width / 2, -initialSize.height / 2, initialSize.width, initialSize.height);
            graphic.endFill();
            this.addChild(graphic);

        }

        mechanics.PhaserWrapper.addGameObject(this);
    }
}
