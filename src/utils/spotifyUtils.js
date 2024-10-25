import { getSpecificWeekSongs } from './storedSongsUtils.js';


export const replyAllMissingSongs = (interaction, winnerDiscordID, loserDiscordID, currentWeekNumber, DISCORD_ID_DICTIONARY, entirePlaylist) => {
    const missingSongs = checkThisWeekEntries(interaction, winnerDiscordID, loserDiscordID, currentWeekNumber, DISCORD_ID_DICTIONARY, entirePlaylist);
    if(!missingSongs){
        interaction.reply('Everyone has added their songs this week!')
    }
}

//Personal use only
export const _songsAsArray = (ENTIRE_PLAYLIST) => {
    let latestSongs = [];
    for (let i = 0; i < ENTIRE_PLAYLIST.length; i++){
        latestSongs.push(ENTIRE_PLAYLIST[i].track.name);
    }
    return latestSongs.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

//Specific format to add into Google Forms 
export const weeklySongNamesAsArray = (interaction, winnerDiscordID, loserDiscordID, currentWeekNumber, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST) => {
    const missingSongs = checkThisWeekEntries(interaction, winnerDiscordID, loserDiscordID, currentWeekNumber, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST);
    if(missingSongs){
        return null;
    }
    let formattedSongs = [];
    for(let i = 0; i < songsThisWeek.length; i++){
        formattedSongs.push(songsThisWeek[i].track.name)
    }
    return formattedSongs.sort();
}


const checkThisWeekEntries = (interaction, winnerDiscordID, currentWeekNumber, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST) => {
    const songsThisWeek = getSpecificWeekSongs(ENTIRE_PLAYLIST, currentWeekNumber, false);
    const winnerSpotifyID = (currentWeekNumber != 1) ? DISCORD_ID_DICTIONARY[winnerDiscordID].spotifyId : null;
    
    let spotifyIdDictionary ={};
    for(let key in DISCORD_ID_DICTIONARY){
        const spotifyId = DISCORD_ID_DICTIONARY[key].spotifyId;
        spotifyIdDictionary[spotifyId] = {realName : DISCORD_ID_DICTIONARY[key].realName, thisWeekSongCount: 0};
    }

    for (let i = 0; i < songsThisWeek.length; i++) {
        const entry = songsThisWeek[i];
        const addedBy = entry.added_by.id;
        spotifyIdDictionary[addedBy].thisWeekSongCount += 1;
    }
    
    const { missing, replyMessage } = checkWeeklySongCount(winnerSpotifyID, spotifyIdDictionary);
    if(missing){
        //console.log("replyMessage", replyMessage);
        interaction.reply(replyMessage);
    }
    return missing;
}

//Check if anyone missed adding a song(s) this week 
const checkWeeklySongCount = (winnerSpotifyID, spotifyIdDictionary) => {
    let replyMessage = '';
    let missing = false;
    for(let spotifyId in spotifyIdDictionary){
        let songsRequired = 0;
        if(winnerSpotifyID != null){
            songsRequired = (spotifyId === winnerSpotifyID) ? 2 : 1;
        } else{
            songsRequired = 3; //Very rare edge case for Week 1.
        }
        if (spotifyIdDictionary[spotifyId].thisWeekSongCount != songsRequired) {
            const countDifference = spotifyIdDictionary[spotifyId].thisWeekSongCount - songsRequired;
            const action = countDifference > 0 ? 'delete' : 'add';
            const count = Math.abs(countDifference);
            replyMessage += `${spotifyIdDictionary[spotifyId].realName} needs to ${action} ${count} song(s) this week.\n`;
            missing = true;
        }
    }
    if (replyMessage) {
        replyMessage = replyMessage.trimEnd();
    }
    return{ missing, replyMessage };
}

//Check the losers list to see if we exclude a song
export const songsFromSpecificWeek = (selectedWeek, currentWeek, loserDiscordID, DISCORD_ID_DICTIONARY, ENTIRE_PLAYLIST) => {
    if(selectedWeek <= 0){
        return null;
    }
    const songCount = ENTIRE_PLAYLIST.length;
    const totalUsers = Object.keys(DISCORD_ID_DICTIONARY).length;
    let beginningIndex = 0, endIndex = 0;    

    if(currentWeek === 1){ //Depends if vote for removal has occurred yet
        endIndex = (!loserDiscordID) ? (totalUsers * 3): (totalUsers * 3) - 1; 
    } else if (selectedWeek === 1) { //First week will have (totalUsers * 3) - 1 songs after voting 
        endIndex = (totalUsers * 3) - 1;
    } else if(selectedWeek === currentWeek){ //The latest week will have (totalUsers + 1) or (totalUsers) songs
        endIndex =  songCount;
        beginningIndex = (!loserDiscordID) ? (endIndex - totalUsers - 1) : (endIndex - totalUsers);
    } else{  //Somewhere in the middle of the playlist
        beginningIndex = ((totalUsers * 3) - 1) + (totalUsers * (selectedWeek - 2));
        endIndex = beginningIndex + totalUsers;
    }
    let specifiedWeekSongs = [];
    for(let i = beginningIndex; i < endIndex; i++){
        specifiedWeekSongs.push(ENTIRE_PLAYLIST[i]);
    }
    return specifiedWeekSongs;
}

export const displaySongsFromSpecificWeek = async (interaction, specificWeekSongs) => {
    let songTitles = [];
    for (let i = 0; i < specificWeekSongs.length; i++) {
        songTitles.push({ title: specificWeekSongs[i].track.name, originalIndex: i }); // Storing the original index
    }
    songTitles.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    const optionsString = songTitles.map((song, index) => `${index + 1}. ${song.title}`).join('\n');

    await interaction.reply(`\`\`\`${optionsString}\`\`\``);
    await interaction.followUp(`Please choose a song for the **Hall of Fame** by typing the corresponding number:\n`);

    try {
        const filter = response => {
            return response.author.id === interaction.user.id && !isNaN(response.content) && response.content > 0 && response.content <= songTitles.length;
        };

        const collectedHOF = await interaction.channel.awaitMessages({
            filter,
            max: 1,
            time: 30000, 
            errors: ['time']
        });

        // Get the user's response for Hall of Fame
        const userResponseHOF = collectedHOF.first().content;
        const selectedIndexHOF = parseInt(userResponseHOF) - 1; 
        const selectedSongHOF = songTitles[selectedIndexHOF];

        await interaction.followUp(`You have selected **${selectedSongHOF.title}** for the **Hall of Fame**: `);
        await interaction.followUp(`Now, please select a song for the **Hall of Shame** by typing the corresponding number:`)
        // Wait for the user's response for File 2
        const collectedHOS = await interaction.channel.awaitMessages({
            filter,
            max: 1,
            time: 30000, 
            errors: ['time']
        });

        // Get the user's response for Hall of Shame
        const userResponseHOS = collectedHOS.first().content; 
        const selectedIndexHOS = parseInt(userResponseHOS) - 1;
        const selectedSongHOS = songTitles[selectedIndexHOS];

        // Final confirmation
        await interaction.followUp(`You have selected **${selectedSongHOS.title}** for the **Hall of Shame**: `)
        await interaction.followUp(`Do you want to confirm these selections? (y/yes or n/no)`);

        // Wait for confirmation response
        let confirmed = false;
        while (!confirmed) {
            const confirmation = await interaction.channel.awaitMessages({
                max: 1,
                time: 30000, // 30 seconds timeout
                errors: ['time']
            });

            const userConfirmation = confirmation.first().content.toLowerCase();

            if (userConfirmation === 'y' || userConfirmation === 'yes') {
                await interaction.followUp(`Selections confirmed. Adding into files... (WIP)`);
                return [specificWeekSongs[songTitles[selectedIndexHOF].originalIndex], specificWeekSongs[songTitles[selectedIndexHOS].originalIndex]]
            } else if (userConfirmation === 'n' || userConfirmation === 'no') {
                await interaction.followUp('Selections cancelled.');
                return null;
            } else {
                await interaction.followUp('Invalid response. Please respond with y/yes or n/no.');
            }
        }
    } catch (error) {
        // Handle timeout or error
        console.error('Error collecting user response:', error);
        await interaction.followUp('You did not respond in time! Please try again.');
    }
}

