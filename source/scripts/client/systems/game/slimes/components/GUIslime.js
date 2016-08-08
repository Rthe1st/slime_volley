/*jshint devel: true, browserify:true*/

'use strict';

import {systemName as drawingSystemName} from '../../../graphics/slime/drawingSystem.js';
import Slime from '../../../../../shared/systems/game/slimes/components/slime.js';
import slimeGraphic from '../../../graphics/slime/components/slime.js';

export default class GUISlime extends Slime{
    constructor(entity, saveInfo){
        super(entity, saveInfo);
        entity.graphicComponents.set(drawingSystemName, new slimeGraphic(entity));
        entity.framework.graphicSystems.get(drawingSystemName).addEntity(entity);
    }

    removeComponents(){
        super.removeComponents();
        this.entity.framework.graphicSystems.get(drawingSystemName).removeEntity(this.entity);
        this.entity.graphicComponents.delete(drawingSystemName);
    }
}
