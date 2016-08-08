/*jshint devel: true, browserify:true*/

'use strict';

import {systemName as physicsSystemName} from '../../physics/system.js';
import BasicPhysics from '../../physics/components/basicPhysics.js';
import SlimeMovement from '../../../input/player/components/slime.js';
import {systemName as playerInputSystemName} from '../../../input/player/system.js';
import {systemName as slimesSystemName} from '../../../game/slimes/system.js';

export default class Slime{
    constructor(entity, saveInfo){
        this.entity = entity;
        this.player = saveInfo.player;
        entity.gameComponents.set(physicsSystemName, new BasicPhysics(entity, {position: saveInfo.position}));
        entity.framework.gameSystems.get(physicsSystemName).addEntity(entity);
        entity.inputComponents.set(playerInputSystemName, new SlimeMovement(entity));
        entity.framework.inputSystems.get(playerInputSystemName).addEntity(this.player, entity);

    }

    removeComponents(){
        this.entity.framework.gameSystems.get(physicsSystemName).removeEntity(this.entity);
        this.entity.gameComponents.delete(physicsSystemName);

        this.entity.framework.inputSystems.get(playerInputSystemName).removeEntity(this.player, this.entity);
        this.entity.inputComponents.delete(playerInputSystemName);

        this.entity.framework.gameSystems.get(slimesSystemName).removeEntity(this.entity);
        this.entity.gameComponents.delete(slimesSystemName);
    }

    save(){
        let physicsBody = this.entity.gameComponents.get(physicsSystemName).body;
        return {
            player: this.player,
            position: [physicsBody.position[0], physicsBody.position[1]]
        };
    }
}
