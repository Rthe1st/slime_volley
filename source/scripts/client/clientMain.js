/*jshint devel: true, browserify:true*/

"use strict";

import Framework from './framework/core.js';
import KeysAdapter from './inputAdapter/Keyboard.js';
import *  as physicsSystem from '../shared/systems/game/physics/system.js';
import *  as drawingSystem from './systems/graphics/slime/drawingSystem.js';
import *  as inputSystem from '../shared/systems/input/player/system.js';

import * as slimesSystem from '../shared/systems/game/slimes/system.js';
import Slime from './systems/game/slimes/components/GUIslime.js';

function clientInitialise(framework){
    console.log('framework initiated');
}

function loadState(framework, state){
    for(let slimeEntity of framework.gameSystems.get(slimesSystem.systemName).slimeEntities.values()){
        slimeEntity.gameComponents.get(slimesSystem.systemName).removeComponents();
        framework.entityManager.removeEntity(slimeEntity);
    }
    //0) RELIES ON EXISTING ENTITIES BEING WIPED PRELOAD
    //(or at cleast existing entities of the same time/uses the same systems)
    //keeping order of components is important for deterministic gameplay after load
    //1) be careful to add components to a system in the same order as original
    //2) careful of entites with overlapping components (non yet)
    //3) do we have to worry about entity order?
    //because core only calls to systems, I suspect not
    //as long as systems are called in same order both client and server side
    for(let slimeInfo of state){
        let entity = framework.entityManager.createEntity();
        entity.gameComponents.set(slimesSystem.systemName, new Slime(entity, slimeInfo));
        framework.gameSystems.get(slimesSystem.systemName).addEntity(entity);
    }
}

window.onload = function(){
    let gameSystems = [physicsSystem, slimesSystem];
    let graphicSystems = [drawingSystem];
    let inputSystems = [inputSystem];
    let framework = new Framework([KeysAdapter], clientInitialise, loadState,
        gameSystems, graphicSystems, inputSystems);
};
