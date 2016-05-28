/*jshint devel: true, browserify:true*/

'use strict';

export class System{
    constructor(websocketServer){
        this.wss = websocketServer;
        this.websockets = new Map();
        this.messageCallbacks = new Map();
        this.nextId = 0;
        this.wss.on("connection", function(websocket) {
            console.log("connection");
            //give websocket id based  existing size of map
            websocket.id = this.nextId;
            this.nextId++;
            this.websockets.set(websocket.id, websocket);
            websocket.onmessage = function(event) {
                let message = JSON.parse(event.data);
                if(this.messageCallbacks.has(message.type)){
                    this.messageCallbacks.get(message.type)(message.payload, websocket);
                }else{
                    console.log("message type " + message.type + " not registered");
                    console.log(message);
                }
            }.bind(this);
            websocket.onclose = function close() {
                this.websockets.delete(websocket.id);
                console.log('disconnected');
            }.bind(this);
        }.bind(this));
    }

    registerMessageCallback(type, callback){
        this.messageCallbacks.set(type, callback);
    }

    send(type, payload, websocketId){
        let message = {"type": type, "payload": payload};
        let websocket = this.websockets.get(websocketId);
        if(websocket.readyState == websocket.OPEN){
            websocket.send(JSON.stringify(message));
        }
    }

    sendBroadCast(type, payload){
        let message = {"type": type, "payload": payload};
        for(let websocket of this.websockets.values()){
            if(websocket.readyState == websocket.OPEN){
                websocket.send(JSON.stringify(message));
            }
        }
    }
}
