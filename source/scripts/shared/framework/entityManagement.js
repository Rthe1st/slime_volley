export class Entity{

    constructor(framework){
        this.id = id;
        this.framework = framework;
        this.inputComponents = new Map();
        this.gameComponents = new Map();
        this.graphicComponents = new Map();
    }
}

export class EntityManager{

    constructor(){
        //replace with uuid?
        this.nextEntityId = 0;
        this.entities = new Map();
    }

    createEntity(){
        let entity = new Entity(this.nextEntityId);
        this.entities.set(this.nextEntityId, entity);
        this.nextEntityId++;
        return entity;
    }
}