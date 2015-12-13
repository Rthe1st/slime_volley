'use strict';

import Framework from '../framework/Framework.js';

function initilise(){
	console.log('framework started');
}

export default function startGame(){

	let componentSystems = [];

	let framework = new Framework(initilise, componentSystems);

	framework.start();

}