import * as p2 from 'p2';
import {systemName as physicsSystemName} from '../system.js';

export default class BasicPhysics{
    constructor(entity, bodyInfo){
        this.entity = entity;
        this.body = new p2.Body(bodyInfo);
        this.body.addShape(new p2.Circle({ radius: 60 }));
        entity.framework.gameSystems.get(physicsSystemName).world.addBody(this.body);
    }

    destroy(){
        this.entity.framework.gameSystems.get(physicsSystemName).world.removeBody(this.body);
        //can we/do we have to destroy bodies in p2?
    }
}
