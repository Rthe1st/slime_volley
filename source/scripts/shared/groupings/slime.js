/*jshint devel: true, browserify:true*/

'use strict';

import {systemName as physicsSystemName} from '../systems/game/physics/system.js';
import SlimePhysics from '../systems/game/physics/components/slime.js';
import SlimeMovement from '../systems/input/components/slime.js';
import {systemName as inputSystemName} from '../systems/input/system.js';

export default function (entity, framework){
    entity.components.set(physicsSystemName, new SlimePhysics(entity));
    framework.gameSystems.get(physicsSystemName).addEntity(entity);

    entity.components.set(inputSystemName, new SlimeMovement(entity));
    framework.inputSystems.get(inputSystemName).addEntity(entity);
}
