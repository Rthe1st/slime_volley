export class Entity{

    constructor(framework, id){
        this.id = id;
        this.framework = framework;
        this.inputComponents = new Map();
        this.gameComponents = new Map();
        this.graphicComponents = new Map();
    }
}

export class EntityManager{

    constructor(framework){
        //replace with uuid?
        this.nextEntityId = 0;
        this.entities = new Map();
        this.framework = framework;
    }

    createEntity(){
        let entity = new Entity(this.framework, this.nextEntityId);
        this.entities.set(this.nextEntityId, entity);
        this.nextEntityId++;
        return entity;
    }

    removeEntity(entity){
        //the undefined check is crap
        //overhang from client and server sharing this
        if(entity.graphicComponents.size > 0){
            console.log("error: deleting component still with graphics");
        }else if(entity.inputComponents.size > 0){
            console.log("error: deleting component still with inputs");
        }else if(entity.gameComponents.size > 0){
            console.log("error: deleting component still with games");
        }else{
            this.entities.delete(entity.id);
        }
    }

}
