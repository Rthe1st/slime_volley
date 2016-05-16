/*jshint devel: true, node:true*/

'use strict';

import socketIO from 'socket.io';

import app from './app.js';
import clientNetworkFramework from '../framework/components/clientNetworkFramework.js';

let clientNetwork = clientNetworkFramework.Network;

export class Network{
    constructor(){
        this.io = socketIO(app.getHttpServer);
        this.io.on('connection', function (socket) {
            let listeners = [
                this.sendMove,
                this.realPing,
                this.manualSync,
                this.disconnect
            ];
            for(let listener of listeners){
                socket.on(listener.name, listener);                
            }
            var payload = {};
            socket.broadcast.emit(clientNetwork.playerJoined.name, payload);
            socket.emit(clientNetwork.playerSet.name, payload);
        });
    }

    update(){

    }

    disconnect() {
        console.log('user disconnected');
    }

    sendMove(data){
        console.log('move recieved');
    }

    realPing(data) {
        console.log('real ping recieved');
    }

    manualSync(data) {
        console.log('manual sync recieved');
    }
}