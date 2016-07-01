/*jshint devel: true, browserify:true*/

'use strict';

import * as pixi from 'pixi.js';

import slimeGrouping from '../../shared/groupings/slime.js';
import *  as drawingSystem from '../systems/graphics/drawingSystem.js';

export default function (entity, framework){
    slimeGrouping(entity, framework);
    //drawing
    let graphics = new pixi.Graphics();
    // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    graphics.lineStyle(0);
    graphics.beginFill(0xFFFF0B, 0.5);
    graphics.drawCircle(0, 0, 60);
    graphics.endFill();
    entity.attributes.set('drawing', new drawingSystem.Attribute(graphics,400, 300));
    framework.graphicSystems.get(drawingSystem.systemName).addEntity(entity);
    
}
