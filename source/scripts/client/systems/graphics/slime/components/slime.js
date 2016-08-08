import * as pixi from 'pixi.js';

import {systemName as drawingSystemName} from '../drawingSystem.js';
import {systemName as physicsSystemName} from '../../../../../shared/systems/game/physics/system.js';

export default class SlimeGraphics{
    constructor(entity){
        if(!entity.gameComponents.has(physicsSystemName)){
            console.log("SlimeGraphics failed, entity: " + entity.id + " has no " + physicsSystemName);
        }

        this.entity = entity;
        let graphics = new pixi.Graphics();
        // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
        graphics.lineStyle(0);
        graphics.beginFill(0xFFFF0B, 0.5);
        graphics.drawCircle(0, 0, 60);
        graphics.endFill();
        this.container = new pixi.Container();
        let physics = this.entity.gameComponents.get(physicsSystemName);
        [this.container.x,this.container.y] = physics.body.position;
        this.container.addChild(graphics);
        let drawing = this.entity.framework.graphicSystems.get(drawingSystemName);
        drawing.stage.addChild(this.container);
    }

    //this shouldnt even get ms_per_update because it should be out side physics loop
    update(ms_per_update){
        let physics = this.entity.gameComponents.get(physicsSystemName);
        [this.container.x,this.container.y] = physics.body.position;
    }

    destroy(){
        let drawing = this.entity.framework.graphicSystems.get(drawingSystemName);
        drawing.stage.removeChild(this.container);
        this.container.destroy();
    }
}
