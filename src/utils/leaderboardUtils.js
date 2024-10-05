import { SongsFromUser } from './spotifyUtils.js';

const formatDuration = (seconds) => {
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

export const calculateCurrentWeek = (ID_DICTIONARY, playlist_JSON) => {
    let totalSongs = playlist_JSON.length;
    const totalUsers = Object.keys(ID_DICTIONARY).length;

    //Added 3 songs per user during first week, every other week is 1
    totalSongs -= (totalUsers * 2);
    let currentWeek = Math.ceil(totalSongs / totalUsers);
    return currentWeek;
}

export const sortedSongs = (category, ID_DICTIONARY, playlist_JSON) => {
    const scores = [];

    for (const discordId in ID_DICTIONARY) {
        const realName = ID_DICTIONARY[discordId].realName;
        const sortedList = SongsFromUser(discordId, ID_DICTIONARY, playlist_JSON);

        let score = 0; 

        // Handle different categories
        if (category === 'popularity' || category === 'duration') {
            let displayScore = '';
            score = calculateAverage(sortedList, category);

            if (category === 'duration') {
                displayScore = formatDuration(Math.floor(score));
            }

            scores.push({ name: realName, score, displayScore });
        } else if (category === 'added') {
            scores.push({ name: realName, score: sortedList.length });
        } else {
            const popularityScore = calculateAverage(sortedList, 'popularity');
            const durationScore = formatDuration(Math.floor(calculateAverage(sortedList, 'duration')));
            scores.push({
                name: realName,
                songs_added: sortedList.length,
                duration: durationScore,
                popularity: popularityScore
            });
        }
    }

    scores.sort((a, b) => {
        if (category === 'added') return b.score - a.score; // For 'added' category, sort by the number of songs
        if (category === 'popularity' || category === 'duration') {
            return b.score === a.score ? a.name.localeCompare(b.name) : b.score - a.score;
        }
    });
    return scores;
};

export function printSongsFromUser(interaction, ID_DICTIONARY, playlist_JSON) {
    const userDetails = interaction.options.get('username');
    const discordId = userDetails.user.id;

    if (!ID_DICTIONARY.hasOwnProperty(discordId)) {
        interaction.reply(`**${userDetails.user.username}** is not part of the Spotify playlist.\n`);
        return;
    }

    const realName = ID_DICTIONARY[discordId].realName;
    const sortedList = SongsFromUser(discordId, ID_DICTIONARY, playlist_JSON);
    let replyMessage = songsReplyMessage(realName, sortedList);

    // Send the reply
    interaction.reply(replyMessage);
}

function songsReplyMessage(realName, sortedList) {
    let replyMessage = `**Songs from ${realName}:**\n`;
    replyMessage += "```"; 
    replyMessage += `| No. | Song Title                                         | Date Added  | Song Popularity |\n`;
    replyMessage += `| --- | -------------------------------------------------- | ----------- | --------------- |\n`;

    sortedList.forEach((entry, index) => {
        let song_name = entry.track.name;
        const dateAdded = entry.added_at; 
        const formattedDate = new Date(dateAdded).toLocaleDateString(); // Format the date
        const popularity = entry.track.popularity;

        const maxTitleLength = 47;
        if (song_name.length > maxTitleLength) {
            song_name = song_name.slice(0, maxTitleLength - 3) + '...';
        }

        replyMessage += `| ${String(index + 1).padEnd(3)} | ${song_name.padEnd(50)} | ${formattedDate.padEnd(11)} | ${popularity.toString().padEnd(15)} |\n`;
    });

    replyMessage += "```";
    return replyMessage;
}

export const displayLeaderboard = async (interaction, option, scores) => {
    let replyMessage = '';

    switch (option) {
        case 'popularity':
            replyMessage = `**Everyone's Average Song Popularity:**\n`;
            replyMessage += `*(The popularity of a track is a value between 0 and 100, with 100 being the most popular)*\n`;
            replyMessage += "```\n| Name          | Song Popularity |\n| ------------- | --------------- |\n";
            scores.forEach(({ name, score }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(15)} |\n`;
            });
            break;

        case 'duration':
            replyMessage = `**Everyone's Average Song Length (in seconds):**\n`;
            replyMessage += "```\n| Name          | Avg Song Length |\n| ------------- | --------------- |\n";
            scores.forEach(({ name, displayScore }) => {
                replyMessage += `| ${name.padEnd(13)} | ${displayScore.toString().padEnd(15)} |\n`;
            });
            break;

        case 'added':
            replyMessage = `**Everyone's Number of Added Songs:**\n`;
            replyMessage += "```\n| Name          | Songs Added |\n| ------------- | ----------- |\n";
            scores.forEach(({ name, score }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(11)} |\n`;
            });
            break;

        default:
            replyMessage = `**Overall Leaderboard:**\n`;
            replyMessage += "```\n| Name          | Songs Added | Avg Song Length | Song Popularity |\n| ------------- | ----------- | --------------- | --------------- |\n";
            scores.forEach(({ name, songs_added, duration, popularity }) => {
                replyMessage += `| ${name.padEnd(13)} | ${songs_added.toString().padEnd(11)} | ${duration.toString().padEnd(15)} | ${popularity.toString().padEnd(15)} |\n`;
            });
            break;
    }

    replyMessage += "```";
    await interaction.reply(replyMessage);
};