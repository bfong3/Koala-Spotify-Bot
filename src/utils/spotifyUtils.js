import { getCurrentTuesdayMidnightPSTinUTC } from './dateUtils.js';

export const songsFromUser = (discordID, DISCORD_ID_DICTIONARY, entirePlaylist) => {
    const spotifyId = DISCORD_ID_DICTIONARY[discordID].spotifyId;
    return entirePlaylist.filter(item => item.added_by.id === spotifyId);
};

export const replyAllMissingSongs = (interaction, winnerDiscordID, DISCORD_ID_DICTIONARY, entirePlaylist) => {
    const missingSongs = checkThisWeekEntries(interaction, winnerDiscordID, DISCORD_ID_DICTIONARY, entirePlaylist);
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
export const weeklySongNamesAsArray = (interaction, winnerDiscordID, DISCORD_ID_DICTIONARY, entirePlaylist) => {
    const missingSongs = checkThisWeekEntries(interaction, winnerDiscordID, DISCORD_ID_DICTIONARY, entirePlaylist);
    if(missingSongs){
        return null;
    }
    let formattedSongs = [];
    for(let i = 0; i < songsThisWeek.length; i++){
        formattedSongs.push(songsThisWeek[i].track.name)
    }
    return formattedSongs.sort();
}

const getThisWeekSongs = (playlistItems, DISCORD_ID_DICTIONARY, winnerDiscordID) => {
    let latestSongs = [];
    const totalUsers = Object.keys(DISCORD_ID_DICTIONARY).length;
    //Once again, only an edge case for Week 1
    const songsPerWeek = (winnerDiscordID != 'nobody') ? totalUsers + 1 : totalUsers * 3;
    const totalSongs = playlistItems.length;
    for (let i = totalSongs - songsPerWeek; i < totalSongs; i++){
        latestSongs.push(playlistItems[i]);
    }
    return latestSongs
}

const checkThisWeekEntries = (interaction, winnerDiscordID, DISCORD_ID_DICTIONARY, entirePlaylist) => {
    const beginningOfWeek = new Date(getCurrentTuesdayMidnightPSTinUTC());
    const songsThisWeek = getThisWeekSongs(entirePlaylist, DISCORD_ID_DICTIONARY, winnerDiscordID);
    const winnerSpotifyID = (winnerDiscordID != 'nobody') ? DISCORD_ID_DICTIONARY[winnerDiscordID].spotifyId : 'nobody';
    
    let spotifyIdDictionary ={};
    for(let key in DISCORD_ID_DICTIONARY){
        const spotifyId = DISCORD_ID_DICTIONARY[key].spotifyId;
        spotifyIdDictionary[spotifyId] = {realName : DISCORD_ID_DICTIONARY[key].realName, thisWeekSongCount: 0};
    }

    for (let i = 0; i < songsThisWeek.length; i++) {
        const entry = songsThisWeek[i];
        const entryDate = entry.added_at;
        const addedBy = entry.added_by.id;

        if(isSongEntryDateValid(entryDate, beginningOfWeek)){
            spotifyIdDictionary[addedBy].thisWeekSongCount += 1;
        }
    }
    
    const { missing, replyMessage } = checkWeeklySongCount(winnerSpotifyID, spotifyIdDictionary);
    if(missing){
        //console.log("replyMessage", replyMessage);
        interaction.reply(replyMessage);
    }
    return missing;
}

//Check if song is added on a valid date
const isSongEntryDateValid = (entryDate, beginningOfWeek) => {
    entryDate = new Date(entryDate);
    beginningOfWeek = new Date(beginningOfWeek);
    return (entryDate > beginningOfWeek) ? true : false;
}

//Check if anyone missed adding a song(s) this week 
const checkWeeklySongCount = (winnerSpotifyID, spotifyIdDictionary) => {
    let replyMessage = '';
    let missing = false;
    for(let spotifyId in spotifyIdDictionary){
        let songsRequired = 0;
        if(winnerSpotifyID != 'nobody'){
            songsRequired = (spotifyId === winnerSpotifyID) ? 2 : 1;
        } else{
            songsRequired = 3; //Very rare edge case for Week 1.
        }
        if (spotifyIdDictionary[spotifyId].thisWeekSongCount != songsRequired) {
            const countDifference = spotifyIdDictionary[spotifyId].thisWeekSongCount - songsRequired;
            const action = countDifference > 0 ? 'delete' : 'add';
            const count = Math.abs(countDifference);
            replyMessage += `${spotifyIdDictionary[spotifyId].realName} needs to ${action} ${count} song(s) this week\n`;
            missing = true;
        }
    }
    if (replyMessage) {
        replyMessage = replyMessage.trimEnd();
    }
    return{ missing, replyMessage };
}