/*jshint devel: true, browserify:true*/

"use strict";

import Framework from './framework/core.js';
import KeysAdapter from 'inputAdapter/Keyboard.js';
import *  as physicsSystem from '../shared/systems/game/physics/system.js';
import *  as drawingSystem from './systems/graphics/drawingSystem.js';
import *  as inputSystem from '../shared/systems/input/system.js';
import slimeGrouping from './groupings/slimeGUI.js';


function initialise(framework){
    console.log('framework inited');
    let entity = framework.entityManager.createEntity();
    slimeGrouping(entity, framework);
}

function loadState(state){
    //console.log(state.randomNumber);
}

window.onload = function(){
    let gameSystems = [physicsSystem];
    let graphicSystems = [drawingSystem];
    let inputSystems = [inputSystem];
    let framework = new Framework(KeysAdapter, initialise, loadState, gameSystems, graphicSystems, inputSystems);
};
