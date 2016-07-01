import {systemName as inputSystemName} from '../system.js'
import {systemName as physicsSystemName} from '../../game/physics/system.js';

export default class SlimeInput{
    constructor(entity){
        if(!this.entity.inputComponents.has(physicsSystemName)){
            console.log("SlimeInput failed, entity: " + entity.id + " has no " + physicsSystemName);
        }
        this.entity = entity;
    }

    update(timeStep, actions){
        let physicsComponent = this.entity.gameComponents.get(physicsSystemName);
        let moveSpeed = timeStep * 2.5;
        if(actions.has('moveLeft')){
            physicsComponent.body.applyForce([-moveSpeed, 0]);
        }else if(actions.has('moveRight')){
            physicsComponent.body.applyForce([moveSpeed, 0]);
        }else if(actions.has('moveUp')) {
            physicsComponent.body.applyForce([0, -moveSpeed]);
        }
        else if(actions.has('moveDown')){
            physicsComponent.body.applyForce([0, moveSpeed]);
        }
    }
}