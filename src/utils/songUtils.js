import { songsFromUser, getSpecificWeekSongs } from './storedSongsUtils.js';
import { getCurrentWeek, getWeekRange } from './dateUtils.js';
import { getRealNameBySpotifyId } from './dictionaryUtils.js';
import fs from 'fs'; 
import { AttachmentBuilder } from 'discord.js';

export async function printSongsFromUser(interaction, DISCORD_ID_DICTIONARY, entirePlaylist) {
    const userDetails = interaction.options.get('username');
    const discordID = userDetails.user.id;

    if (!DISCORD_ID_DICTIONARY.hasOwnProperty(discordID)) {
        const invalidUser = `**${userDetails.user.username}** is not part of the Spotify playlist.\n`;
        return invalidUser;
    }

    const realName = DISCORD_ID_DICTIONARY[discordID].realName;
    const sortedList = songsFromUser(discordID, entirePlaylist, true);
    const message =  songsFromUserReplyMessage(realName, sortedList);
    await sendFile(interaction, message);
}

//String for all the songs added by user
function songsFromUserReplyMessage(realName, sortedList) {
    let replyMessage = `Songs from ${realName}:\n\n`;

    sortedList.forEach((entry, index) => {
        let songName = entry.song.track.name;
        const dateAdded = entry.song.added_at; 
        const artists = entry.song.track.artists.map(artist => artist.name).join(', ');
        const formattedDate = new Date(dateAdded).toLocaleDateString(); // Format the date
        const songPopularity = entry.song.track.popularity;
        const spaces = index + 1 < 10 ? '   ' : '    ';

        replyMessage += `${index + 1}. ${songName}`;
        if(entry.vote.winner === true){
            replyMessage += ' [⭐Weekly Favorite⭐]';
        }
        if(entry.vote.loser === true){
            replyMessage += ' [💀Voted Out💀]';
        }
        replyMessage += '\n';
        replyMessage += `${spaces}Artist(s): ${artists}\n`;
        replyMessage += `${spaces}Date Added: ${formattedDate}\n`;
        replyMessage += `${spaces}Song Popularity: ${songPopularity}\n\n`;
    });

    return replyMessage;
}

export async function printSongsFromWeek(interaction, DISCORD_ID_DICTIONARY, entirePlaylist, weekNumber) {
    if(weekNumber < 0 || weekNumber > getCurrentWeek()){
        interaction.reply(`Enter a Week Number between 1 and ${getCurrentWeek()}`);
        return;
    }
    let weekSongs = getSpecificWeekSongs(entirePlaylist, weekNumber, true);
    weekSongs = sortByTrackName(weekSongs);
    const message = songsFromWeekReplyMessage(weekSongs, DISCORD_ID_DICTIONARY, weekNumber);
    await sendFile(interaction, message);
}

function sortByTrackName(songsArray) {
    return songsArray.sort((a, b) => {
        const nameA = a.song.track.name.toUpperCase(); // Convert to uppercase to ensure case-insensitive sorting
        const nameB = b.song.track.name.toUpperCase(); 

        if (nameA < nameB) {
            return -1; // a comes before b
        }
        if (nameA > nameB) {
            return 1; // a comes after b
        }
        return 0; // names are equal
    });
}

function songsFromWeekReplyMessage(weekSongs, DISCORD_ID_DICTIONARY, weekNumber) {
    const weekRange = getWeekRange(weekNumber);
    let replyMessage = `Songs from Week ${weekNumber} (${weekRange.start} - ${weekRange.end}):\n\n`;
    weekSongs.forEach((entry, index) => {
        let songName = entry.song.track.name;
        const artists = entry.song.track.artists.map(artist => artist.name).join(', ');
        const addedBy = getRealNameBySpotifyId(entry.song.added_by.id,DISCORD_ID_DICTIONARY); 
        const songPopularity = entry.song.track.popularity;
        const spaces = index + 1 < 10 ? '   ' : '    ';

        replyMessage += `${index + 1}. ${songName}`;
        if(entry.vote.winner === true){
            replyMessage += ' [⭐Weekly Favorite⭐]';
        }
        if(entry.vote.loser === true){
            replyMessage += ' [💀Voted Out💀]';
        }
        replyMessage += '\n';
        replyMessage += `${spaces}Artist(s): ${artists}\n`;
        replyMessage += `${spaces}Added By: ${addedBy}\n`;
        replyMessage += `${spaces}Song Popularity: ${songPopularity}\n\n`;
    });
    return replyMessage;
}

// Send file to ypass 2000 character limit from discord
async function sendFile(interaction, fileContents){
    const filePath = 'message.txt';
    const file = createTempFile(filePath, fileContents);
    await interaction.reply({ files: [file] });
    deleteTempFile(filePath);
}

function createTempFile(filePath, fileContents){
    fs.writeFileSync(filePath, fileContents, 'utf8'); 

    try {
        return new AttachmentBuilder(filePath);
    } catch (error) {
        console.error('Error sending the file:', error);
    }
};

const deleteTempFile = (filePath) => {
    fs.unlink(filePath, (err) => { // Use callback style for unlink
        if (err) {
            console.error('Error deleting the file:', err);
        } else {
            console.log('File deleted successfully.');
        }
    });
};