/*jshint devel: true, browserify:true*/

'use strict';

export class System{
    constructor(){}

    setWebSocket(websocketServer){
        this.websocketServer = websocketServer;
        websocketServer.on('connection', function(ws) {
            console.log("connection");
            ws.send("sent_from_server");
            ws.on('close', function() {
                console.log('close');
            });
            ws.on('message', function(data){
                console.log(data);
            });
        });

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

    update(){
        //read clients input and update world state
    }

    //this should nothing as all "entirites" need updating based on server state
    //unless we decide to exclude some
    /*addEntity(entity){
        this.stage.addChild(entity.attributes.get('drawing').container);
        this.entities.set(entity.id, entity);
    }*/

    sendData(data){
    }
}
