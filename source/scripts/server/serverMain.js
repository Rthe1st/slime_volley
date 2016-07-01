/*jshint devel: true*/

import Framework from './framework/core.js';//'../framework/Framework.js';
import slimeGrouping from '../shared/groupings/slime.js';

import *  as physicsSystem from '../shared/systems/game/physics/system.js';
import *  as inputSystem from '../shared/systems/input/system.js';

function initilise(framework){
    console.log('framework initiated');
    let entity = framework.entityManager.createEntity();
    slimeGrouping(entity, framework);
}

function saveState(){

}

function connect(player){
    console.log("connect");
}

function disconnect(player){
    console.log("disconnect");
}

export default function startGame(websocketServer){
    let gameSystems = [physicsSystem];
    let graphicSystems = [drawingSystem];
    let inputSystems = [inputSystem];
    let framework = new Framework(initilise, saveState, connect, disconnect,
                                  gameSystems, inputSystems, websocketServer);
}
