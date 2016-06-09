/*jshint devel: true*/

import Framework from './framework/core.js';//'../framework/Framework.js';
import *  as physicsSystem from '../shared/components/physicsSystem.js';
import slimeGrouping from '../shared/groupings/slime.js';
import * as localInput from './framework/localInput.js';
import * as networking from './framework/networking.js';
import GameClock from './framework/gameClock.js';

function initilise(framework){
    console.log('framework inited');
    let entity = framework.createEntity();
    slimeGrouping(entity, framework);
    //entity.become(slimeSystem.slimeGrouping);
}

export default function startGame(websocketServer){
    let framework = new Framework(initilise, networking, GameClock, [physicsSystem], websocketServer);
}
