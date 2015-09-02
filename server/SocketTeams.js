"use strict";

//todo: merge this into gameplay teams by treating it as a component or similar
export default class {
    constructor() {
        this.numConnected = 0;
        this.numTeams = 2;
        this.teamSize = 1;
        this.playerLimit = this.numTeams * this.teamSize;
        this.teams = [];
        for (var i = 0; i < numTeams; i++) {
            this.teams[i] = {};
            this.teams[i].freeSlimes = [];
            for (var slime = 0; slime < teamSize; slime++) {
                this.teams[i].freeSlimes[slime] = slime;
            }
            this.teams[i].assignedSlimes = [];
        }
        this.observerSockets = [];
    }

    assignSlime(socket) {
        for (var i = 0; i < this.teams.length; i++) {
            if (this.teams[i].freeSlimes.length > 0) {
                socket.team = i;
                socket.slime = this.teams[i].freeSlimes.pop();
                this.teams[socket.team].assignedSlimes[socket.slime] = socket;
                break;
            }
        }
    }

    removeSlime(socket) {
        delete this.teams[socket.team].assignedSlimes[socket.slime];
        this.teams[socket.team].freeSlimes.push(socket.slime);
    }

    static playerMessage(socket, reason, broadcast) {
        var payload = {
            team: socket.team,
            slime: socket.slime,
            numUsers: numConnected,
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
        assignSlime(socket);
        playerMessage(socket, messageTypes.playerSet, false);
        playerMessage(socket, messageTypes.playerJoined, true);
    }

    processConnection(socket) {
        //add users as they connected
        //first 2 are players, rest observers
        //player 1 is authoritative
        console.log('a user connected');
        if (this.numConnected < this.playerLimit) {
            setPlayer(socket);
        } else {
            console.log('players full, adding observer');
            socket.type = 'observer';
            socket.emit(messageTypes.observerSet);
            socket.observerNum = observerSockets.length;
            this.observerSockets.push(socket);
        }
        registerDisconnect(socket);
    }

    registerDisconnect(socket){
        socket.on('disconnect', function () {
            //if player 1 leaves, authority passes to the observer replacing them
            if (socket.type === 'player') {
                playerMessage(socket, messageTypes.playerLeft, true);
                removeSlime(socket);
                if (this.observerSockets.length > 0) {
                    setPlayer(this.observerSockets.shift());
                }
            } else {
                this.observerSockets.splice(this.socket.observerNum, 1);
            }
            console.log('user disconnected');
        });

    }

    getSocket(team, slime){
        return this.teams[team].assignedSlimes[slime];
    }
}
