/*jshint devel: true, browserify:true*/

"use strict";

import Framework from '../framework/frameworks/client.js';///'../framework/Framework.js';
import *  as physicsSystem from '../framework/components/physicsSystem.js';
import *  as drawingSystem from '../framework/components/drawingSystem.js';
import slimeGrouping from '../framework/groupings/slimeGUI.js';
import * as localInput from '../framework/localInput/client.js';
import * as networking from '../framework/networking/client.js';
import GameClock from '../framework/gameClock/client.js';

function initilise(framework){
    console.log('framework inited');
    let entity = framework.createEntity();
    slimeGrouping(entity, framework);
    //entity.become(slimeSystem.slimeGrouping);
}

window.onload = function(){
    let framework = new Framework(initilise, localInput, networking, GameClock, [physicsSystem, drawingSystem]);
};
