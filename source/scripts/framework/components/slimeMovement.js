export default class Behavior{
    constructor(entity){
        this.entity = entity;
    }
    //update(){}

    recieveMessage(message){
        if(message.type == 'left'){
            this.entity.attributes.get('physics').body.applyForce([-100,0]);
        }else if(message.type == 'right'){
            this.entity.attributes.get('physics').body.applyForce([100,0]);
        }else if(message.type == 'jump'){
            this.entity.attributes.get('physics').body.applyForce([0,-100]);
        }
    }
}
