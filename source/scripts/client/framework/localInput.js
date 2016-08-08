//component contract:
//update(actions)

export default class LocalInput{

    constructor(){
        this.actionPacks = new Map();
    }

    simulateInput(rewindSimulationFrame){
        if(this.actionPacks.has(rewindSimulationFrame)){
            return this.actionPacks.get(rewindSimulationFrame);
        }else{
            return new Map();
        }

    }

    clearOldActions(frameCutoff){
        //may be worth caching this sort
        let frames = Array.from(this.actionPacks.keys()).sort((a,b) => a - b);
        for(let frame of frames){
            if(frame < frameCutoff){
                this.actionPacks.delete(frame);
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
                for(let entry of actions.entries()){
                    let action = entry[0];
                    let value = entry[1];
                    existingActions.set(action, value);
                }
            }
        }
    }
}
