/*jshint devel: true, browserify:true*/

'use strict';

import * as pixi from 'pixi.js';

export class Attribute{
    constructor(graphics, x, y){
        this.container = new pixi.Container();
        this.container.x = x;
        this.container.y = y;
        this.container.addChild(graphics);
    }
}

export class System{
    constructor(){
        this.entities = new Map();
        this.stage = new pixi.Container();
        this.renderer = pixi.autoDetectRenderer(800, 600,{backgroundColor : 0x1099bb});
        document.body.appendChild(this.renderer.view);
    }

    update(){
        for(let entity of this.entities.values()){
            let physics = entity.attributes.get('physics');
            let drawing = entity.attributes.get('drawing');
            console.log(physics.body.position);
            [drawing.container.x,drawing.container.y] = physics.body.position;
        }
        this.renderer.render(this.stage);
    }

    addEntity(entity){
        this.stage.addChild(entity.attributes.get('drawing').container);
        this.entities.set(entity.id, entity);
    }
}