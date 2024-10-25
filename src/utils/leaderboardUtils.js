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

const sortedByCategorySongs = (category, DISCORD_ID_DICTIONARY, entirePlaylist) => {
    const categorizedSongs = [];
    for (const discordID in DISCORD_ID_DICTIONARY) {
        const realName = DISCORD_ID_DICTIONARY[discordID].realName;
        const sortedList = songsFromUser(discordID, entirePlaylist, false);
        let score = 0; 

        // Handle different categories
        if (category === 'popularity' || category === 'duration') {
            let displayScore = '';
            score = calculateAverage(sortedList, category);

            if (category === 'duration') {
                displayScore = convertSecondsToMinutes(Math.floor(score));
            }

            categorizedSongs.push({ name: realName, score, displayScore });
        } else if (category === 'added') {
            categorizedSongs.push({ name: realName, score: sortedList.length });
        } else {
            const popularityScore = calculateAverage(sortedList, 'popularity');
            const durationScore = convertSecondsToMinutes(Math.floor(calculateAverage(sortedList, 'duration')));
            categorizedSongs.push({
                name: realName,
                songsCount: sortedList.length,
                songDuration: durationScore,
                songPopularity: popularityScore
            });
        }
    }

    categorizedSongs.sort((a, b) => {
        if (category === 'added') return b.score - a.score; // For 'added' category, sort by the number of songs
        if (category === 'popularity' || category === 'duration') {
            return b.score === a.score ? a.name.localeCompare(b.name) : b.score - a.score;
        }
    });
    return categorizedSongs;
};

const createLeaderboard = (option, categorizedSongs) => {
    let replyMessage = '';

    switch (option) {
        case 'popularity':
            replyMessage = `**Everyone's Average Song Popularity:**\n`;
            replyMessage += `*(The popularity of a track is a value between 0 and 100, with 100 being the most popular)*\n`;
            replyMessage += "```\n| Name          | Song Popularity |\n| ------------- | --------------- |\n";
            categorizedSongs.forEach(({ name, score }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(15)} |\n`;
            });
            break;

        case 'duration':
            replyMessage = `**Everyone's Average Song Length:**\n`;
            replyMessage += "```\n| Name          | Avg Song Length |\n| ------------- | --------------- |\n";
            categorizedSongs.forEach(({ name, displayScore }) => {
                replyMessage += `| ${name.padEnd(13)} | ${displayScore.toString().padEnd(15)} |\n`;
            });
            break;

        case 'added':
            replyMessage = `**Everyone's Number of Added Songs:**\n`;
            replyMessage += "```\n| Name          | Songs Added |\n| ------------- | ----------- |\n";
            categorizedSongs.forEach(({ name, score }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(11)} |\n`;
            });
            break;

        default:
            replyMessage = `**Overall Leaderboard:**\n`;
            replyMessage += "```\n| Name          | Songs Added | Avg Song Length | Song Popularity |\n| ------------- | ----------- | --------------- | --------------- |\n";
            categorizedSongs.forEach(({ name, songsCount, songDuration, songPopularity }) => {
                replyMessage += `| ${name.padEnd(13)} | ${songsCount.toString().padEnd(11)} | ${songDuration.toString().padEnd(15)} | ${songPopularity.toString().padEnd(15)} |\n`;
            });
            break;
    }

    replyMessage += "```";
    return replyMessage;
};

export function displayLeaderboard(interaction, DISCORD_ID_DICTIONARY, entirePlaylist){
    const selectedCategory = interaction.options.get('category').value;
    const categorizedSongs = sortedByCategorySongs(selectedCategory, DISCORD_ID_DICTIONARY, entirePlaylist);
    return createLeaderboard(selectedCategory, categorizedSongs);
}