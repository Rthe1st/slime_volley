//component contract:
//update(actions)

export default class LocalInput{

    constructor(){
        this.actionPacks = [];
    }

    simulateInput(rewindSimulationTime, time_step){
        let actionPacks = [];
        //looping through a list is a bit shit
        for(let actionPack of this.actionPacks){
            if(actionPack.time > rewindSimulationTime && actionPack.time < rewindSimulationTime + time_step) {
                actionPacks.append(actionPack);
            }
        }
        return actionPacks
    }

    //call this after a state load
    clearOldActions(stateTime){
        let numberOfOldActionPacks = 0;
        for(let actionPack of this.actionPacks){
            if(actionPack.time < stateTime){
                numberOfOldActionPacks++;
            }else{
                break;
            }
        }
        this.actionPacks.slice(0, numberOfOldActionPacks);
    }

    insertNewActionPacks(newActionPacks){
        //again, loops are pretty shit
        for(let newActionPack of newActionPacks){
            for(let index=0; index<this.actionPacks.length; index++){
                let indexActionPack = this.actionPacks[index];
                if(indexActionPack.time < newActionPack.time){
                    this.actionPacks.splice(index+1, 0, newActionPack);
                    break;
                }
            }
        }
    }
}
