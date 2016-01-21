/*jshint devel: true, browserify:true*/

"use strict";

import Framework from '../framework/Framework.js';
import *  as physicsFramework from '../framework/components/physicsFramework.js';
import *  as drawingFramework from '../framework/components/drawingFramework.js';

function initilise(framework){
    console.log('framework inited');
    let entityID = framework.createEntity();
    let physicsComponent = new physicsFramework.Component(entityID);
    framework.physicsFramework.addComponent(physicsComponent);
    let drawingComponent = new drawingFramework.Component(entityID);
    framework.drawingFramework.addComponent(drawingComponent);

}

window.onload = function(){
    let framework = new Framework(initilise);
    framework.start();
};