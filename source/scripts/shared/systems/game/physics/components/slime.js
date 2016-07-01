import * as p2 from 'p2';
import {systemName as physicsSystemName} from '../game/physics.js';

export default class SlimePhysics{
    constructor(entity){
        this.entity = entity;
        this.body = new p2.Body({
            mass: 1,
            position: [400, 300],
            angle: 0,
            velocity: [0, 0],
            angularVelocity: 0
        });
        this.body.addShape(new p2.Circle({ radius: 60 }));
        entity.framework.gameComponents.get(physicsSystemName).world.addBody(this.body);
    }
}