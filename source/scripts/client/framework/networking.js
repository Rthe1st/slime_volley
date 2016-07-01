/*jshint devel: true, browserify:true*/

'use strict';

export default class networking {
    constructor(){
        this.ws = new WebSocket('ws://127.0.0.1');
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
            this.getListener(message.type)(message.payload);
        }.bind(this);
        this.getListener.get("connect")(null);
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
            console.log("message type " + type + " not registered");
        }
    }

    addListener(type, callback){
        this.listeners.set(type, callback);
    }
}
