/*jshint devel: true, browserify:true*/

"use strict";

import Framework from '../framework/Framework.js';
import *  as physicsSystem from '../framework/components/physicsSystem.js';
import *  as drawingSystem from '../framework/components/drawingSystem.js';
import slimeGrouping from '../framework/groupings/slime.js';

function initilise(framework){
    console.log('framework inited');
    let entity = framework.createEntity();
    slimeGrouping(entity, framework);
    //entity.become(slimeSystem.slimeGrouping);
}

window.onload = function(){
    let framework = new Framework(initilise);
    framework.start();
};