import { DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST } from './index.js'
import * as utils from './utils/index.js';

//await utils.createStoredSongs(DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST);
//await utils.enterVoteResult('185149371149582336', "Mr. Brightside", '153668556934873089', "Hate Yourself");

//
const currentWeek = utils.getCurrentWeek();
const weekRange = utils.getWeekRange(1);
//await utils.updateStoredSongs(currentWeek, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST);
//const storedSongs = await utils.loadStoredSongs();


//console.log(currentWeek);
//console.log(weekRange);
//console.log(storedSongs);
console.log("Done");