import {systemName as physicsSystemName} from '../../../game/physics/system.js';

export default class SlimeInput{
    constructor(entity){
        this.entity = entity;
        if(!this.entity.gameComponents.has(physicsSystemName)){
            console.log("SlimeInput failed, entity: " + entity.id + " has no " + physicsSystemName);
        }
    }

    update(timeStep, actions){
        let physicsComponent = this.entity.gameComponents.get(physicsSystemName);
        let moveSpeed = timeStep * 2.5;
        if(actions.has('moveLeft')){
            physicsComponent.body.position[0] += -moveSpeed;
        }else if(actions.has('moveRight')){
            physicsComponent.body.position[0] += moveSpeed;
        }else if(actions.has('moveUp')) {
            physicsComponent.body.position[1] += moveSpeed;
        }
        else if(actions.has('moveDown')){
            physicsComponent.body.position[1] += -moveSpeed;
        }
    }

}
