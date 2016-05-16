/*jshint devel: true*/

import Framework from '../framework/Framework.js';
import *  as physicsSystem from '../framework/components/physicsSystem.js';
import slimeGrouping from '../framework/groupings/slime.js';
import * as localInput from '../framework/localInput/server.js';
import * as networking from '../framework/networking/server.js';

function initilise(framework){
    console.log('framework inited');
    let entity = framework.createEntity();
    slimeGrouping(entity, framework);
    //entity.become(slimeSystem.slimeGrouping);
}

export default function startGame(websocketServer){
    let framework = new Framework(initilise, localInput, networking, [physicsSystem], false);
    framework.networking.setWebSocket(websocketServer);
    framework.start();
}
