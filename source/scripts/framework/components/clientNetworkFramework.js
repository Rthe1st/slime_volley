export Class Network{
    constructor(){
        let socket = io.connect();
        listeners = [
            this.syncResponse,
            this.sendState,
            this.playerJoined,
            this.playerSet
        ];
        for(let listener of listeners){
            socket.on(listener.name, listener);
        }
    }

    update(){

    }

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