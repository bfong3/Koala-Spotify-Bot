import { AttachmentBuilder } from 'discord.js';
import fs from 'fs/promises';

export const displayFileContents = async (interaction, commandName, currentWeek) => {
    const option = interaction.options.get('specify');
    //console.log(option.value);
    const fileName = (commandName === 'hall_of_fame') ? 'src/Weekly Results/winners.txt' : 'src/Weekly Results/losers.txt';
    if (option.value === 'all'){
        sendEntireFile(interaction, fileName);
    }
    else{
        const weekNumber = interaction.options.getNumber('number');
        getSpecificWeek(interaction, fileName, weekNumber, currentWeek);
    }
};

const sendEntireFile = async (interaction, fileName) => {
    try {
        await fs.access(fileName); // Throws an error if the file does not exist
        
        const file = new AttachmentBuilder(fileName); // Create an attachment with the file
        await interaction.reply({ files: [file] }); // Send the file as a reply
    } catch (err) {
        // Handle error for file not found or any other errors
        if (err.code === 'ENOENT') {
            await interaction.reply('File not found.'); // Specific error for file not found
        } else {
            console.error(`Error sending file: ${err}`);
            await interaction.reply('There was an error sending the file.'); // General error message
        }
    }
};

const getSpecificWeek = async (interaction, fileName, weekNumber, currentWeek) => {
    if(!weekNumber || weekNumber <= 0){
        interaction.reply(`Enter a valid number from 1 to ${currentWeek}.\n **/${interaction.commandName} <week> <number>**`);
        return
    } 
    else if (weekNumber > currentWeek){
        interaction.reply(`Chill out, we haven\'t made it to **Week ${weekNumber}** yet...`);
        return;
    }
    try {
        const data = await fs.readFile(fileName, 'utf8'); // Read file asynchronously
        const lines = data.split('\n');
        let weekFound = false; // Flag to check if the week was found
        let weekEntry = '```'; // To store the found week entry

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
                break; // Exit loop after finding the week
            }
        }
        weekEntry += '```'
        // Respond based on whether the week was found
        if (weekFound) {
            await interaction.reply(`Here are the details for Week ${weekNumber}:\n${weekEntry}`);
        } else {
            console.log(`Week ${weekNumber} is missing from ${fileName}.`);
            await interaction.reply(`Week ${weekNumber} is missing.`);
        }

    } catch (err) {
        console.error(`Error reading file: ${err}`);
        await interaction.reply('There was an error reading the file.');
    }
}