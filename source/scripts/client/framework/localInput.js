//component contract:
//update(actions)

export default class LocalInput{

    constructor(){
        this.actionPacks = new Map();
    }

    simulateInput(rewindSimulationFrame){
        return this.actionPacks.get(rewindSimulationFrame);
    }

    clearOldActions(frameCutoff){
        //may be worth caching this sort
        let frames = this.actionPacks.keys().sort();
        for(let frame of frames){
            if(frame < frameCutoff){
                this.actionPacks.delete(frame)
            }else{
                break;
            }
        }
    }

    insertNewActionPacks(newActionPacks){
        //again, loops are pretty shit
        for(let newActionPack of newActionPacks){
            let frame = newActionPack.frame;
            if(!this.actionPacks.has(frame)){
                this.actionPacks.set(frame, new Map());
            }
            let frameMap = this.actionPacks.get(frame);
            let player = newActionPack.player;
            let actions = newActionPack.actions;
            if(!frameMap.has(player)){
                frameMap.set(player, actions);
            }else{
                //overwrite existing actions
                let existingActions = frameMap.get(player);
                for(let action, value of actions.entries()){
                    existingActions.set(action, value);
                }
            }
        }
    }
}
