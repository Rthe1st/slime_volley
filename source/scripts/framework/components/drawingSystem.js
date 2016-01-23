/*jshint devel: true, browserify:true*/

'use strict';

import * as pixi from 'pixi.js';

export class Component{
    constructor(entityID){
        let graphics = new pixi.Graphics();
        // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
        graphics.lineStyle(0);
        graphics.beginFill(0xFFFF0B, 0.5);
        graphics.drawCircle(470, 90,60);
        graphics.endFill();
        this.container = new pixi.Container();
        this.container.addChild(graphics);
        this.ID = entityID;
    }

    update(){

    }
}

export class System{
    constructor(framework){
        this.framework = framework;
        this.componentList = new Map();
        this.stage = new pixi.Container();
        this.renderer = pixi.autoDetectRenderer(800, 600,{backgroundColor : 0x1099bb});
        document.body.appendChild(this.renderer.view);
    }

    update(){
        console.log("drawing system update");
        for(let component of this.componentList.values()){
            component.update();
        }
        this.renderer.render(this.stage);
    }

    addComponent(component){
        this.stage.addChild(component.container);
        this.componentList.set(component.entityID, component);
    }
}