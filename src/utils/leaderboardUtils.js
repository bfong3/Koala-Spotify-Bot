import { songsFromUser } from './storedSongsUtils.js';

const convertSecondsToMinutes = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    return `${minutes}:${remainderSeconds.toString().padStart(2, '0')}`;
};

const calculateAverage = (list, category) => {
    let total = 0;
    list.forEach(item => {
        if (category === 'popularity') {
            total += item.track.popularity;
        } else if (category === 'duration') {
            total += item.track.duration_ms / 1000;
        }
    });
    return parseFloat((total / list.length).toFixed(1));
};


export const sortedByCategorySongs = (category, DISCORD_ID_DICTIONARY, entirePlaylist) => {
    const userStats = [];

    for (const discordID in DISCORD_ID_DICTIONARY) {
        const realName = DISCORD_ID_DICTIONARY[discordID].realName;
        const sortedList = songsFromUser(discordID, entirePlaylist);
        let score = 0; 

        // Handle different categories
        if (category === 'popularity' || category === 'duration') {
            let displayScore = '';
            score = calculateAverage(sortedList, category);

            if (category === 'duration') {
                displayScore = convertSecondsToMinutes(Math.floor(score));
            }

            userStats.push({ name: realName, score, displayScore });
        } else if (category === 'added') {
            userStats.push({ name: realName, score: sortedList.length });
        } else {
            const popularityScore = calculateAverage(sortedList, 'popularity');
            const durationScore = convertSecondsToMinutes(Math.floor(calculateAverage(sortedList, 'duration')));
            userStats.push({
                name: realName,
                songsCount: sortedList.length,
                songDuration: durationScore,
                songPopularity: popularityScore
            });
        }
    }

    userStats.sort((a, b) => {
        if (category === 'added') return b.score - a.score; // For 'added' category, sort by the number of songs
        if (category === 'popularity' || category === 'duration') {
            return b.score === a.score ? a.name.localeCompare(b.name) : b.score - a.score;
        }
    });
    return userStats;
};

export function printSongsFromUser(interaction, DISCORD_ID_DICTIONARY, entirePlaylist) {
    const userDetails = interaction.options.get('username');
    const discordID = userDetails.user.id;

    if (!DISCORD_ID_DICTIONARY.hasOwnProperty(discordID)) {
        interaction.reply(`**${userDetails.user.username}** is not part of the Spotify playlist.\n`);
        return;
    }

    const realName = DISCORD_ID_DICTIONARY[discordID].realName;
    const sortedList = songsFromUser(discordID, entirePlaylist);
    let replyMessage = songsFromUserReplyMessage(realName, sortedList);

    interaction.reply(replyMessage);
}

//String for all the songs added by user
function songsFromUserReplyMessage(realName, sortedList) {
    let replyMessage = `**Songs from ${realName}:**\n`;
    replyMessage += "```"; 
    replyMessage += `| No. | Song Title                                         | Date Added  | Song Popularity |\n`;
    replyMessage += `| --- | -------------------------------------------------- | ----------- | --------------- |\n`;

    sortedList.forEach((entry, index) => {
        let song_name = entry.track.name;
        const dateAdded = entry.added_at; 
        const formattedDate = new Date(dateAdded).toLocaleDateString(); // Format the date
        const songPopularity = entry.track.popularity;

        const maxTitleLength = 47; //Adjust to whatever cutoff you want 
        if (song_name.length > maxTitleLength) {
            song_name = song_name.slice(0, maxTitleLength - 3) + '...';
        }

        replyMessage += `| ${String(index + 1).padEnd(3)} | ${song_name.padEnd(50)} | ${formattedDate.padEnd(11)} | ${songPopularity.toString().padEnd(15)} |\n`;
    });

    replyMessage += "```";
    return replyMessage;
}

export const displayLeaderboard = async (interaction, option, userStats) => {
    let replyMessage = '';

    switch (option) {
        case 'popularity':
            replyMessage = `**Everyone's Average Song Popularity:**\n`;
            replyMessage += `*(The popularity of a track is a value between 0 and 100, with 100 being the most popular)*\n`;
            replyMessage += "```\n| Name          | Song Popularity |\n| ------------- | --------------- |\n";
            userStats.forEach(({ name, score }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(15)} |\n`;
            });
            break;

        case 'duration':
            replyMessage = `**Everyone's Average Song Length (in seconds):**\n`;
            replyMessage += "```\n| Name          | Avg Song Length |\n| ------------- | --------------- |\n";
            userStats.forEach(({ name, displayScore }) => {
                replyMessage += `| ${name.padEnd(13)} | ${displayScore.toString().padEnd(15)} |\n`;
            });
            break;

        case 'added':
            replyMessage = `**Everyone's Number of Added Songs:**\n`;
            replyMessage += "```\n| Name          | Songs Added |\n| ------------- | ----------- |\n";
            userStats.forEach(({ name, score }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(11)} |\n`;
            });
            break;

        default:
            replyMessage = `**Overall Leaderboard:**\n`;
            replyMessage += "```\n| Name          | Songs Added | Avg Song Length | Song Popularity |\n| ------------- | ----------- | --------------- | --------------- |\n";
            userStats.forEach(({ name, songsCount, songDuration, songPopularity }) => {
                replyMessage += `| ${name.padEnd(13)} | ${songsCount.toString().padEnd(11)} | ${songDuration.toString().padEnd(15)} | ${songPopularity.toString().padEnd(15)} |\n`;
            });
            break;
    }

    replyMessage += "```";
    await interaction.reply(replyMessage);
};