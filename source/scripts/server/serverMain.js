/*jshint devel: true*/

import gameMain from '../shared/gameMain.js';

import Framework from './framework/core.js';//'../framework/Framework.js';

import *  as physicsSystem from '../shared/systems/game/physics/system.js';
import *  as inputSystem from '../shared/systems/input/player/system.js';

import * as slimesSystem from '../shared/systems/game/slimes/system.js';
import Slime from '../shared/systems/game/slimes/components/slime.js';

function serverInitialise(framework){
    console.log('framework initiated');
}

function saveState(framework){
    let slimesSystemInstance = framework.gameSystems.get(slimesSystem.systemName);
    return slimesSystemInstance.save();
}

function loadState(framework, state){
    for(let slimeEntity of framework.gameSystems.get(slimesSystem.systemName).slimeEntities.values()){
        slimeEntity.gameComponents.get(slimesSystem.systemName).removeComponents();
        framework.entityManager.removeEntity(slimeEntity);
    }
        console.log("state");
    console.log(state);
    for(let slimeInfo of state){
        let entity = framework.entityManager.createEntity();
        entity.gameComponents.set(slimesSystem.systemName, new Slime(entity, slimeInfo));
        framework.gameSystems.get(slimesSystem.systemName).addEntity(entity);
    }
}

//connect has "this" bound to framework
function connect(framework, player){
    console.log("connect");
    let entity = framework.entityManager.createEntity();
    let slimeInfo = {
        player: player,
        position: [100,200]
    };
    entity.gameComponents.set(slimesSystem.systemName, new Slime(entity, slimeInfo));
    framework.gameSystems.get(slimesSystem.systemName).addEntity(entity);
}

//disconnect has "this" bound to framework
function disconnect(framework, player){
    //todo: this
    console.log("disconnect");
    let slimeEntity_id = framework.gameSystems.get(slimesSystem.systemName).findPlayerSlime.get(player);
    let slimeEntity = framework.gameSystems.get(slimesSystem.systemName).slimeEntities.get(slimeEntity_id);
    slimeEntity.gameComponents.get(slimesSystem.systemName).removeComponents();
    framework.entityManager.removeEntity(slimeEntity);
}

export default function startGame(websocketServer){
    let gameSystems = [physicsSystem, slimesSystem];
    let inputSystems = [inputSystem];
    let framework = new Framework(serverInitialise, saveState, loadState, connect, disconnect,
                                  gameSystems, inputSystems, websocketServer);
}
