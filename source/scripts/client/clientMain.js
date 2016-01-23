/*jshint devel: true, browserify:true*/

"use strict";

import Framework from '../framework/Framework.js';
import *  as physicsSystem from '../framework/components/physicsSystem.js';
import *  as drawingSystem from '../framework/components/drawingSystem.js';

function initilise(framework){
    console.log('framework inited');
    let entityID = framework.createEntity();
    let physicsComponent = new physicsSystem.Component(entityID);
    framework.physicsSystem.addComponent(physicsComponent);
    let drawingComponent = new drawingSystem.Component(entityID);
    framework.drawingSystem.addComponent(drawingComponent);
}

window.onload = function(){
    let framework = new Framework(initilise);
    framework.start();
};