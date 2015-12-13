"use strict";

import Framework from '../framework/Framework.js';
import *  as physicsFramework from '../framework/components/physicsFramework.js';

function initilise(framework){
    console.log('framework inited');
    let entityID = framework.createEntity();
    let component = new physicsFramework.Component(entityID);
    framework.physicsFramework.addComponent(component);
}

let framework = new Framework(initilise);

framework.start();