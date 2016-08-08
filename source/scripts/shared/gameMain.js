import {systemName as slimesSystemName} from './systems/game/slimes/system.js';
import Slime from './systems/game/slimes/components/slime.js';

//graphics vs not graphics may make this hard to share
//really only the initialise function needs to be shared
//all the others are exclusively client or server side

//or we could we import these functions into modules with different imports defined?
//one defining GUI graphics import, one not