"use strict";

import messageTypes from './../source/scripts/MessageTypes.js';

//todo: merge this into gameplay teams by treating it as a component or similar
export default class SocketTeams{
    constructor() {
        this.numConnected = 0;
        this.numTeams = 2;
        this.teamSize = 1;
        this.playerLimit = this.numTeams * this.teamSize;
        this.teams = [];
        for (var i = 0; i < this.numTeams; i++) {
            this.teams[i] = [];
            this.teams[i].freeSlimes = [];
            for (var slime = 0; slime < this.teamSize; slime++) {
                this.teams[i].freeSlimes[slime] = slime;
            }
            this.teams[i].assignedSlimes = [];
        }
        this.observerSockets = [];
    }

    assignSlime(socket) {
        for (var i = 0; i < this.teams.length; i++) {
            console.log('team '+i+' freeSlimes: '+this.teams[i].freeSlimes);
            if (this.teams[i].freeSlimes.length > 0) {
                socket.team = i;
                socket.slime = this.teams[i].freeSlimes.pop();
                this.teams[socket.team].assignedSlimes[socket.slime] = socket;
                console.log('player: '+socket.team);
                console.log('slime: '+socket.slime);
                console.log('team size: '+this.teams[socket.team].assignedSlimes.length);
                break;
            }
        }
    }

    removeSlime(socket) {
        this.teams[socket.team].assignedSlimes.splice(socket.slime, 1);
        this.teams[socket.team].freeSlimes.push(socket.slime);
    }

    static playerMessage(socket, reason, broadcast) {
        var payload = {
            team: socket.team,
            slime: socket.slime,
            numUsers: this.numConnected
        };
        if (broadcast) {
            socket.broadcast.emit(reason, payload);
        } else {
            socket.emit(reason, payload);
        }
    }

    setPlayer(socket) {
        console.log('adding new player');
        socket.type = 'player';
        socket.newSamplePacks = [];
        socket.samplePacks = [];
        this.assignSlime(socket);
        SocketTeams.playerMessage(socket, messageTypes.playerSet, false);
        SocketTeams.playerMessage(socket, messageTypes.playerJoined, true);
    }

    processConnection(socket) {
        //add users as they connected
        //first 2 are players, rest observers
        //player 1 is authoritative
        console.log('a user connected');
        if (this.numConnected < this.playerLimit) {
            this.setPlayer(socket);
        } else {
            console.log('players full, adding observer');
            socket.type = 'observer';
            socket.emit(messageTypes.observerSet);
            socket.observerNum = this.observerSockets.length;
            this.observerSockets.push(socket);
        }
        this.registerDisconnect(socket);
    }

    registerDisconnect(socket){
        let socketTeam = this;
        socket.on('disconnect', function () {
            //if player 1 leaves, authority passes to the observer replacing them
            if (socket.type === 'player') {
                SocketTeams.playerMessage(socket, messageTypes.playerLeft, true);
                socketTeam.removeSlime(socket);
                if (socketTeam.observerSockets.length > 0) {
                    socketTeam.setPlayer(socketTeam.observerSockets.shift());
                }
            } else {
                socketTeam.observerSockets.splice(socket.observerNum, 1);
            }
            console.log('user disconnected');
        });

    }

    getSocket(team, slime){
        return this.teams[team].assignedSlimes[slime];
    }
}
