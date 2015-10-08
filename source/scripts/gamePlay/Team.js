/*jslint browser: true, browserify: true, devel: true*/
'use strict';

import Goal from './Goal.js';
import Slime from './Slime.js';
import StatCard from './StatCard.js';
import {settings} from './mechanics.js';

export default class {
    constructor(color, goalCords, slimeCords, statCords, mechanics) {
        this.startSlimeCords = slimeCords;
        this.color = color;
        this.goal = new Goal(goalCords.x, goalCords.y, this.color, settings.initialGoalSize, mechanics);
        this.slimes = [];
        this.slimes[0] = new Slime(slimeCords.x, slimeCords.y, this.color, mechanics);
        this.statCard = new StatCard(statCords, 0, mechanics.PhaserWrapper.game);
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
