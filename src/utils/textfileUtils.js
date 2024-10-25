import { AttachmentBuilder } from 'discord.js';
import fs from 'fs/promises';

export const HOF_FILE = 'src/Weekly Results/winners.txt'
export const HOS_FILE = 'src/Weekly Results/losers.txt'

// Display specfic week details or sends entire file
export const getFileContents = async (commandName) => {
    const fileName = (commandName === 'hall_of_fame') ? HOF_FILE : HOS_FILE;
    return await checkFile(fileName);
};

//Perform entry manipulation in selected file based on selected command. 
//export const addEntry()
//export const editEntry()
//export const removeEntry()

// Check if file exists
const checkFile = async (fileName) => {
    try {
        await fs.access(fileName); // Throws an error if the file does not exist
        return new AttachmentBuilder(fileName); // Create an attachment with the file
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error('File not found.');
            return 'File not found.';
        } else {
            console.error(`Error sending file: ${err}`);
            return 'There was an error sending the file.';
        }
    }
};

//Searches for the specfic week we're on since starting. i.e (Week 1, Week 10, etc... ) then prints out the data
const getSpecificWeekEntry = async (interaction, fileName, weekNumber, currentWeek, reply) => {
    if(currentWeek === 1 && weekNumber == 0){ //THIS IS THE ONLY TIME WHEN WEEK 0 IS OK
        return null;
    }    
    if(!weekNumber || weekNumber <= 0){
        interaction.reply(`Enter a valid number from 1 to ${currentWeek}.\n **/${interaction.commandName} <week> <number>**`);
        return null;
    } 
    else if (weekNumber > currentWeek){
        interaction.reply(`Chill out, we haven\'t made it to **Week ${weekNumber}** yet...`);
        return;
    }
    try {
        const data = await fs.readFile(fileName, 'utf8'); 
        const lines = data.split('\n');
        let weekFound = false; 
        let weekEntry = '```';

        // Loop through the lines in chunks of 5 (4 lines for the entry + 1 for the empty line)
        for (let i = 0; i < lines.length; i += 5) {
            const weekLine = lines[i]?.trim(); // Trim to avoid leading/trailing whitespace
            
            // Check if the week line matches the requested week
            if (weekLine && weekLine.startsWith(`Week: ${weekNumber}`)) {
                weekFound = true;

                // Gather the four lines for this week entry
                weekEntry += `${weekLine}\n`; // Add the week line in bold
                weekEntry += `${lines[i + 1]?.trim()}\n`; // Add the "Added By" line in bold
                weekEntry += `${lines[i + 2]?.trim()}\n`; // Add the "Song" line in bold
                weekEntry += `${lines[i + 3]?.trim()}\n`; // Add the "Artist" line in bold
                break; 
            }
        }
        weekEntry += '```'
        if (weekFound) {
            return weekEntry;
        } else {
            if(reply){
                console.log(`Week ${weekNumber} is missing from ${fileName}.`);
                await interaction.reply(`There is no entry for Week ${weekNumber}.`);
            }
            return null;
        }
    } catch (err) {
        console.error(`Error reading file: ${err}`);
        await interaction.reply('There was an error reading the file.');
    }
}

const getWinnerName = (entry) => {
    const lines = entry.split('\n');
    let addedByLine = lines.find(line => line.startsWith('Added By:'));

    // Extract the name
    if (addedByLine) {
        const name = addedByLine.replace('Added By: ', '').trim(); // Remove the prefix and trim any whitespace
        return name;
    }
}

// Get winner/loser discord ID from specified week
export const getDiscordID = async (interaction, file, weekNumber, DISCORD_ID_DICTIONARY, currentWeek) => {
    file = (file === 'winner') ? HOF_FILE : HOS_FILE;
    //You want the winner from LAST WEEK, to see who adds an additional song the current week
    const entry = (file === HOF_FILE) ? await getSpecificWeekEntry(interaction, file, weekNumber, currentWeek, true) : await getSpecificWeekEntry(interaction, file, weekNumber, currentWeek, false);
    if(!entry){
        return entry;
    }
    const realName = getWinnerName(entry);
    for (const discordID in DISCORD_ID_DICTIONARY) {
        if (DISCORD_ID_DICTIONARY[discordID].realName === realName) {
            return discordID; // Return the Discord ID if a match is found
        }
    }
    console.log(`Couldn't find DiscordID associated with ${realName}.\n`);
    return null;
}