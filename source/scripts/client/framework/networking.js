/*jshint devel: true, browserify:true*/

'use strict';

export default class networking {
    constructor(){
        this.ws = new WebSocket('ws://192.168.0.4');
        this.queue = [];
        this.listeners = new Map();
        this.ws.onopen = function() {
            while(this.queue.length > 0){
                let type, payload;
                ({type, payload} = this.queue.pop());
                this.send(type, payload);
            }
        }.bind(this);

        this.ws.onmessage = function(event) {
            let message = JSON.parse(event.data);
            if(message.type =="state"){
                //console.log("message: " + message);
                //console.log(message.payload);
            }
            if(this.listeners.has(message.type)){
                this.getListener(message.type)(message.payload);
            }
        }.bind(this);
        //this.getListener("connect")(null);
    }

    send(type, payload){
        let message = {"type": type, "payload": payload};
        //console.log("ws ready state" + this.ws.readyState);
        if(this.ws.readyState == this.ws.OPEN){
            this.ws.send(JSON.stringify(message));
        }else{
            this.queue.push(message);
        }
    }

    getListener(type){
        if(this.listeners.has(type)){
            return this.listeners.get(type);
        }else{
            //console.log("message type " + type + " not registered");
            //console.log(this.listeners.keys());
        }
    }

    addListener(type, callback){
        //console.log("adding " + type + " to listeners");
        this.listeners.set(type, callback);
        //console.log("listeners has "+ type + " " + this.listeners.has(type));
    }
}
