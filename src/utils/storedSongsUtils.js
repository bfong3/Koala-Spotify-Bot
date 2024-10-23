import { getWeekNumber } from './dateUtils.js';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { entirePlaylist } from '../index.js';

/**
 * Writes a JavaScript object to a JSON file.
 * 
 * @param {Object} data - The data to write to the file.
 * @param {string} relativePath - The relative path to the file where data will be written.
 */

const FILE_PATH = '../Stored Songs/storedSongs.txt';

//THIS ONE SORTS FROM LIST OBTAINED BY SPOTIFY API
const _songsFromUser = (discordID, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST) => {
    const spotifyId = DISCORD_ID_DICTIONARY[discordID].spotifyId;
    return ENTIRE_PLAYLIST.filter(item => item.added_by.id === spotifyId);
};


//Modifying Functions 
//---------------------------------------------------------------------------------------------------------------------
const writeToFile = async (filePath, data) => {
    try {
        const dataToWrite = JSON.stringify(data, null, 2); // Pretty print JSON with 2 spaces
        await fs.writeFile(filePath, dataToWrite);
        console.log('Data successfully written to', filePath);
    } catch (err) {
        console.error('Error writing to file:', err);
        throw err; // Rethrow error if necessary
    }
};

const timeFunction = (label, func) => {
    console.time(label);
    const result = func();
    console.timeEnd(label);
    return result;
};

const readStoredSongs = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, '../Stored Songs/storedSongs.txt');

    try {
        const data = await timeFunction('ReadingFile', async () => {
            return await fs.readFile(filePath, 'utf8');
        });

        const storedSongs = timeFunction('ParsingData', () => JSON.parse(data));
        return storedSongs; 
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
        throw err; 
    }
};

// Async function to load stored songs
export const loadStoredSongs = async () => {
    try {
        const storedSongs = await readStoredSongs(); // Correct function call
        /*
        console.log('Stored Songs:', storedSongs); // Now storedSongs contains the data
        for (const discordID in storedSongs) {
            const userEntry = storedSongs[discordID];
            console.log(`User: ${userEntry.name}`);
            
            // Loop through songs
            userEntry.songs.forEach((songArray) => {
                songArray.forEach((songEntry, songIndex) => {
                    //console.log(`  Song ${songIndex + 1}: ${songEntry.song}, Vote: ${songEntry.vote}`);
                    console.log(`  Song ${songIndex + 1}:`, JSON.stringify(songEntry.song, null, 2), `Vote: ${songEntry.vote}`);
                });
            });
        }
        */
        return storedSongs; // Return if you want to use it later
    } catch (error) {
        console.error('Error occurred while loading stored songs:', error);
    }
};

//Don't call this more than once otherwise all previous history is gone
export const createStoredSongs = async (DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST) => {
    let storedSongs = {};
    for (const discordID in DISCORD_ID_DICTIONARY) {
        let userEntry = { songs: [] };
        const userSongs = _songsFromUser(discordID, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST);
        for(let i = 0; i < userSongs.length; i++){
            const dateAdded = new Date(userSongs[i].added_at);      
            const weekNumber = getWeekNumber(dateAdded);
            const index = weekNumber - 1;

            // Ensure the songs array has enough sub-arrays for the weeks
            while (userEntry.songs.length <= index) {
                userEntry.songs.push([]);
            }

            const entry = {song: userSongs[i], vote: {winner: false, loser: false}};
            userEntry.songs[index].push(entry);
        }
        storedSongs[discordID] = userEntry;
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, FILE_PATH);

    await writeToFile(filePath, storedSongs);
}

export const updateStoredSongs = async (weekNumber, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST) => {
    const storedSongs = await loadStoredSongs();
    for (const discordID in storedSongs) {
        while (storedSongs[discordID].songs.length <= weekNumber - 1) { 
            storedSongs[discordID].songs.push([]); //Adds an array for the potential new week(s)
        }
        if(storedSongs[discordID].songs[weekNumber-1].length > 0){
            storedSongs[discordID].songs[weekNumber-1] = []; // "Reset" the songs for the week
        }
        const userSongs = _songsFromUser(discordID, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST);
        for(let i = 0; i < userSongs.length; i++){
            const dateAdded = new Date(userSongs[i].added_at);      
            const songWeekNumber = getWeekNumber(dateAdded);
            const index = songWeekNumber - 1;
            if(songWeekNumber === weekNumber){
                const entry = {song: userSongs[i], vote: null};
                storedSongs[discordID].songs[index].push(entry);
            }
        }
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, FILE_PATH);

    await writeToFile(filePath, storedSongs);
}

const updateSongVote = (userWeekSongs, songTitle, voteResult) => {
    let songFound = false;
    for (let j = 0; j < userWeekSongs.length; j++) {
        if (userWeekSongs[j].song.track.name === songTitle) {
            if (voteResult === true){
                userWeekSongs[j].vote.winner = true; 
            } else {
                userWeekSongs[j].vote.loser = true; 
            }
            // console.log(userWeekSongs[j].song.track.name);
            // console.log(userWeekSongs[j].vote);
            songFound = true;
            break;
        }
    }
    return { userWeekSongs, songFound };
};

//true =  winner, false = loser 
//Winner has to be from the latest week, but loser can be from any week
export const enterVoteResult = async (winnerDiscordID, winnerSongTitle, loserDiscordID, loserSongTitle) => {
    let storedSongs = await loadStoredSongs();
    const winnerUserSongs = storedSongs[winnerDiscordID].songs; //Array of arrays
    const loserUserSongs = storedSongs[loserDiscordID].songs;

    for (let i = 0; i < winnerUserSongs.length; i++) {
        let winnerUserWeekSongs = winnerUserSongs[i]; // Array of songs from one week
        const { userWeekSongs, songFound } = updateSongVote(winnerUserWeekSongs, winnerSongTitle, true);
        if (songFound) {
            storedSongs[winnerDiscordID].songs[i] = userWeekSongs; // Update storedSongs with updated week songs
            break; 
        }
    }

    for (let i = 0; i < loserUserSongs.length; i++) {
        let loserUserWeekSongs = loserUserSongs[i]; // Array of songs from one week
        const { userWeekSongs, songFound } = updateSongVote(loserUserWeekSongs, loserSongTitle, false);
        if (songFound) {
            storedSongs[loserDiscordID].songs[i] = userWeekSongs; // Update storedSongs with updated week songs
            break; 
        }
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, FILE_PATH);

    await writeToFile(filePath, storedSongs);
} 


//Accessing Functions 
//---------------------------------------------------------------------------------------------------------------------

//THIS ONE SORTS BASED ON MY DATA STRUCT (USE THIS ONE)
export const songsFromUser = (discordID, entirePlaylist) => {
    let userSongs = [];
    let userData = entirePlaylist[discordID];
    for(let i = 0; i < userData.songs.length; i++){
        let weeklyUserSongs = userData.songs[i];
        for(let j = 0; j < weeklyUserSongs.length; j++){
            if(weeklyUserSongs[j].vote === false){ //Song was voted out from the playlist
                continue;
            }
            //console.log(weeklyUserSongs[j].vote);
            userSongs.push(weeklyUserSongs[j].song);
        }
    }
    return userSongs;
};


export const getSpecificWeekSongs = (entirePlaylist, weekNumber) => {
    let latestSongs = [];
    const index = weekNumber - 1;
    for (const discordID in entirePlaylist){
        const userWeeklySongs = entirePlaylist[discordID].songs[index];
        for(let i = 0; i < userWeeklySongs.length; i++){
            if(userWeeklySongs.vote === false){
                continue;
            }
            latestSongs.push(userWeeklySongs[i].song);
        }
    }
    return latestSongs;
}

export const getAllSongs = (entirePlaylist) => {
    let allSongs = [];
    for (const discordID in entirePlaylist){
        allSongs = allSongs.concat(songsFromUser(discordID, entirePlaylist));
    }
    return allSongs;
}

export const songTitlesAsArray = (entirePlaylist, weekNumber) => {
    let requestedSongs = [];
    let returnedSongs = [];
    if(weekNumber === null){
        requestedSongs = getAllSongs(entirePlaylist);
    } else{
        requestedSongs = getSpecificWeekSongs(entirePlaylist, weekNumber);
    }
    for(let i = 0; i < requestedSongs.length; i++){
        returnedSongs.push(requestedSongs[i].track.name);
    }
    returnedSongs.sort();
    return returnedSongs;
}