/*jshint devel: true, browserify:true*/

"use strict";

import Framework from './framework/core.js';
import *  as physicsSystem from '../shared/components/physicsSystem.js';
import *  as drawingSystem from './components/drawingSystem.js';
import slimeGrouping from './groupings/slimeGUI.js';
import * as localInput from './framework/localInput.js';
import * as networking from './framework/networking.js';
import GameClock from './framework/gameClock.js';


function initilise(framework){
    console.log('framework inited');
    let entity = framework.createEntity();
    slimeGrouping(entity, framework);
    //entity.become(slimeSystem.slimeGrouping);
}

window.onload = function(){
    let framework = new Framework(initilise, localInput, networking, GameClock, [physicsSystem, drawingSystem]);
};
