/*jshint devel: true, browserify:true*/

'use strict';

import * as p2 from 'p2';

import *  as physicsSystem from '../components/physicsSystem.js';
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
        framework.componentSystems.get(physicsSystem.systemName).addEntity(entity);
        entity.behaviors.set('slimeMovement', new slimeMovement(entity));
}
