/*jshint devel: true, browserify:true*/

'use strict';

export class System{
    constructor(){
        this.ws = new WebSocket('ws://127.0.0.1');
        this.queue = [];
        this.messageCallbacks = new Map();
        this.ws.onopen = function() {
            while(this.queue.length > 0){
                this.send(this.queue.pop());
            }
        }.bind(this);

        this.ws.onmessage = function(event) {
            let message = JSON.parse(event.data);
            if(this.messageCallbacks.has(message.type)){
                this.messageCallbacks.get(message.type)(message.payload);
            }else{
                console.log("message type " + message.type + " not registered");
            }
        }.bind(this);
    }

    registerMessageCallback(type, callback){
        this.messageCallbacks.set(type, callback);
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
}
