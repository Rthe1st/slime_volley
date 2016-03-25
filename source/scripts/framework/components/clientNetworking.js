/*jshint devel: true, browserify:true*/

'use strict';

export class System{
    constructor(){
        this.ws = new WebSocket('ws://127.0.0.1');
        this.onmessage = function (event) {
            console.log("message");
        };
        this.ws.onopen = function() {
            console.log("open");
            this.ws.send('something');
        }.bind(this);

        this.ws.onmessage = function() {
            console.log("message");
            // flags.binary will be set if a binary data is received.
            // flags.masked will be set if the data was masked.
        };

        /*let socket = io.connect();
        let listeners = [
            this.syncResponse,
            this.sendState,
            this.playerJoined,
            this.playerSet
        ];
        for(let listener of listeners){
            socket.on(listener.name, listener);
        }*/
    }

    send_input(input){
        console.log("send input");
        this.ws.send(input);
    }

    //this should nothing as all "entirites" need updating based on server state
    //unless we decide to exclude some
    /*addEntity(entity){
        this.stage.addChild(entity.attributes.get('drawing').container);
        this.entities.set(entity.id, entity);
    }*/

    syncResponse(){
        console.log('syncResponse recieved');
    }

    playerJoined() {
        console.log('playerJoined recieved');
    }

    playerSet() {
        console.log('playerSet recieved');
    }

    sendState(data){
        console.log('Got state recieved');
    }
}
