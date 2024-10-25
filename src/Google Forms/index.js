import { loadStoredSongs, songTitlesAsArray } from '../utils/storedSongsUtils.js';
import { getCurrentWeek } from '../utils/dateUtils.js';
import fs from 'fs/promises';

// Get the current week number
const currentWeek = getCurrentWeek();

// Dynamically create the file path based on the current week number
const FILE_PATH = `./src/Google Forms/Weekly Songs/Week_${currentWeek}_Songs.txt`;

function writeToFile(filePath, currentWeek, thisWeeksSongTitles, allSongTitles) {
    let dataToWrite = `Week Number: ${currentWeek}\n`; 

    // Write this week's song titles
    dataToWrite += '\nThis Week\'s Songs:\n';
    thisWeeksSongTitles.forEach((songArray, index) => {
        dataToWrite += `${index + 1}: ${JSON.stringify(songArray)}\n`;
    });

    // Write all song titles
    dataToWrite += '\nAll Songs:\n';
    allSongTitles.forEach((songArray, index) => {
        dataToWrite += `${index + 1}: ${JSON.stringify(songArray)}\n`;
    });

    // Write to the specified file
    fs.writeFile(filePath, dataToWrite, (err) => {
        if (err) {
            return console.error('Error writing to file:', err);
        }
        console.log('Data written to file successfully!');
    });
}

export async function exportSongs() {
    const allSongs = await loadStoredSongs();
    const thisWeeksSongTitles = songTitlesAsArray(allSongs, currentWeek);
    //console.log(thisWeeksSongTitles);
    const allSongTitles = songTitlesAsArray(allSongs, null);
    writeToFile(FILE_PATH ,currentWeek, thisWeeksSongTitles, allSongTitles);
}
