import { AttachmentBuilder } from 'discord.js';
import fs from 'fs/promises';

export const HOF_FILE = 'src/Weekly Results/winners.txt'
export const HOS_FILE = 'src/Weekly Results/losers.txt'

//Display specfic week details or sends entire file
export const displayFileContents = async (interaction, commandName, currentWeek) => {
    const fileName = (commandName === 'hall_of_fame') ? HOF_FILE : HOS_FILE;
    sendEntireFile(interaction, fileName);
    /*const selectedCategory = interaction.options.get('specify');
    const fileName = (commandName === 'hall_of_fame') ? HOF_FILE : HOS_FILE;
    if (selectedCategory.value === 'all'){
        sendEntireFile(interaction, fileName);
    }
    else{
        const weekNumber = interaction.options.getNumber('number');
        const weekEntry = await getSpecificWeekData(interaction, fileName, weekNumber, currentWeek, true);
        if(weekEntry != null){
            interaction.reply(`Here are the details for Week ${weekNumber}:\n${weekEntry}`);
        }
    }*/
};

//Perform entry manipulation in selected file based on selected command. 
//export const addEntry()
//export const editEntry()
//export const removeEntry()

//Sends entire file as an attachment
const sendEntireFile = async (interaction, fileName) => {
    try {
        await fs.access(fileName); // Throws an error if the file does not exist
        const file = new AttachmentBuilder(fileName); // Create an attachment with the file
        await interaction.reply({ files: [file] }); // Send the file as a reply
    } catch (err) {
        if (err.code === 'ENOENT') {
            await interaction.reply('File not found.'); 
        } else {
            console.error(`Error sending file: ${err}`);
            await interaction.reply('There was an error sending the file.');
        }
    }
};

//Searches for the specfic week we're on since starting. i.e (Week 1, Week 10, etc... ) then prints out the data
const getSpecificWeekData = async (interaction, fileName, weekNumber, currentWeek, reply) => {
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
            return await weekEntry;
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

export const getLatestDiscordID = async (interaction, file, weekNumber, DISCORD_ID_DICTIONARY, currentWeek) => {
    file = (file === 'winner') ? HOF_FILE : HOS_FILE;
    //You want the winner from LAST WEEK, but loser from THIS WEEK (if applicable)
    const entry = (file === HOF_FILE) ? await getSpecificWeekData(interaction, file, weekNumber, currentWeek, true) : await getSpecificWeekData(interaction, file, weekNumber, currentWeek, false);
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