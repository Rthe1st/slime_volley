export default class ComponentManagement{
    //each system much have .systemName and .System()
    constructor(componentSystems){
        this.systems = new Map();
        //create a second graphical systems list, this can be called outside of physics loop
        for(let componentSystem of componentSystems){
            this.systems.set(componentSystem.systemName, new componentSystem.System());
        }
    }

    get size(){
        return this.systems.size;
    }

    get(systemName){
        return this.systems.get(systemName);
    }

    set(systemName, system){
        this.systems.set(systemName, system);
    }

    //input systems take time step and actions
    //others just take actions
    //using .apply is a shit hack making things less clear
    //subclass to make explicit?
    update(){
        //this order is deterministic, is in insertion order
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
        for(let componentSystem of this.systems.values()){
            componentSystem.update.apply(componentSystem, arguments);
        }
    }
}
