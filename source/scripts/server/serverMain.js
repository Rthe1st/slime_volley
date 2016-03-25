/*jshint devel: true*/

import Framework from '../framework/Framework.js';
import *  as physicsSystem from '../framework/components/physicsSystem.js';
//import *  as drawingSystem from '../framework/components/drawingSystem.js';
import slimeGrouping from '../framework/groupings/slime.js';
import * as userInput from '../framework/components/userInput.js';

function initilise(framework){
    console.log('framework inited');
    let entity = framework.createEntity();
    slimeGrouping(entity, framework);
    //entity.become(slimeSystem.slimeGrouping);
}

export default function startGame(){
    let framework = new Framework(initilise, [physicsSystem], false);
    framework.start();
}
