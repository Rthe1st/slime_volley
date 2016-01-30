/*jshint devel: true, browserify:true*/

'use strict';

import * as p2 from 'p2';
import * as pixi from 'pixi.js';

import *  as physicsSystem from '../components/physicsSystem.js';
import *  as drawingSystem from '../components/drawingSystem.js';
import * as userInput from '../components/userInput.js';
import slimeMovement from '../components/slimeMovement.js';

export default function (entity, framework){
        let body = new p2.Body({
            mass: 1,
            position: [400, 300],
            angle: 0,
            velocity: [0, 0],
            angularVelocity: 0
        });
        body.addShape(new p2.Circle({ radius: 60 }));
        entity.attributes.set('physics', new physicsSystem.Attribute(body));
        framework.physicsSystem.addEntity(entity);

        //drawing
        let graphics = new pixi.Graphics();
        // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
        graphics.lineStyle(0);
        graphics.beginFill(0xFFFF0B, 0.5);
        graphics.drawCircle(0, 0, 60);
        graphics.endFill();
        entity.attributes.set('drawing', new drawingSystem.Attribute(graphics,400, 300));
        framework.drawingSystem.addEntity(entity);
        let left = 37;
        let up = 38;
        let right = 39;
        let keyMapping = [
            [left, 'left'],
            [right, 'right'],
            [up, 'jump'],
        ];
        entity.behaviors.set('userInput', new userInput.Behavior(entity, keyMapping));
        framework.userInputSystem.addEntity(entity);
        entity.behaviors.set('slimeMovement', new slimeMovement(entity));
}
