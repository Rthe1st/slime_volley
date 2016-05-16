/*jshint devel: true, browserify:true*/

'use strict';

import * as pixi from 'pixi.js';

import slimeGrouping from './slime.js';
import *  as drawingSystem from '../components/drawingSystem.js';
import * as localInput from '../localInput/client.js';

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
        framework.componentSystems.get(drawingSystem.systemName).addEntity(entity);
        //input
        let left = 37;
        let up = 38;
        let right = 39;
        let keyMapping = [
            [left, 'left'],
            [right, 'right'],
            [up, 'jump'],
        ];
        //this is a bit shit, relies on user importing same lolcalInput lib as framework
        entity.behaviors.set('localInput', new localInput.Behavior(entity, keyMapping));
        framework.localInput.addEntity(entity);
}
