import dotenv from 'dotenv'; 
import { getPlaylistData } from './Spotify Code/app.js';
import { Client, IntentsBitField, AttachmentBuilder } from 'discord.js';
import fs from 'fs';

dotenv.config();

const idDictionary = {
    '153668556934873089': { realName: 'Austin', spotifyId: 'hvusf4hnl8efw64698yoaiiar' },
    '168519409504223232': { realName: 'Brandan', spotifyId: 'wolfhunter76' },
    '166248299014258688': { realName: 'Chris', spotifyId: '21wwnjg7kgtxz2utci2gjjcea' },
    '185149371149582336': { realName: 'Darren L', spotifyId: 'ymsah78fe0gdg36j00seehr98' },
    '153662800609148928': { realName: 'Darren M', spotifyId: '22cytkqxyrwww2wrj3y6f7xpq' },
    '145988945585373184': { realName: 'David', spotifyId: 'oglenny' },
    '221448942230044674': { realName: 'Franklin', spotifyId: 'franklinsss121' },
    '168499897358614530': { realName: 'Joseph', spotifyId: '12171960076' },
    '175424644977917953': { realName: 'Justin', spotifyId: '12166240208' },
    '178319927646617601': { realName: 'Kai', spotifyId: 'yqzwz048uvd4wimtoyy74bd57' },
    '178319927646617601': { realName: 'Michael', spotifyId: '22ykd3a2sxif3tudh2rhn7nhy' },
    '216377314982756356': { realName: 'Ranen', spotifyId: '22vfgrxvdndvgnyz7bj5zv4di' },
    '153665486494629888': { realName: 'Ryan', spotifyId: 'fax416ds7nujqx58lirt8yz3j' },
    '153579334286835712': { realName: 'Shawn', spotifyId: '1265167543' },
    '183771302828572672': { realName: 'Spencer', spotifyId: '1245414659' },
    '143083192159698944': { realName: 'Zhao', spotifyId: 'bb3amt8y4jl2pakk857soxwly' }
};

const client = new Client({intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
],
});

const sendTextFile = async (interaction, filePath) => {
    try {
        // Ensure the file exists before attempting to send
        if (fs.existsSync(filePath)) {
            const file = new AttachmentBuilder(filePath); // Create an attachment with the file
            await interaction.reply({ content: 'Here is the text file:', files: [file] });
        } else {
            await interaction.reply('File not found.');
        }
    } catch (err) {
        console.error(`Error attaching file: ${err}`);
        await interaction.reply('There was an error sending the file.');
    }
};

const fetchAndLogPlaylistData = async () => {
    try {
        const playlistItems = await getPlaylistData();
        return playlistItems;
    } catch (error) {
        console.error('Error fetching playlist data:', error);
    }
};

const SongsFromUser = async (discordId, playlistItems) => {
    const spotifyId = idDictionary[discordId].spotifyId;
    return await playlistItems.filter(item => item.added_by.id === spotifyId);
}

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

const sortedSongs = async (category) => {
    const scores = [];

    for (const discordId in idDictionary) {
        const realName = idDictionary[discordId].realName;
        const sortedList = await SongsFromUser(discordId, playlist_JSON);

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

let playlist_JSON;

client.on('ready', async (c) => {
    console.log(`${c.user.tag} is ready.`);
    playlist_JSON = await fetchAndLogPlaylistData();
});

client.on('interactionCreate', async (interaction) =>{
    if(!interaction.isChatInputCommand()) return;

    if(interaction.commandName === 'songs'){
        const userDetails = interaction.options.get('username');
        const discordId = userDetails.user.id;
        if (!idDictionary.hasOwnProperty(discordId)) {
            interaction.reply(`**${userDetails.user.username}** is not part of the Spotify playlist.\n`);
            return; 
        }
        const realName = idDictionary[discordId].realName;
        const sortedList = await SongsFromUser(discordId, playlist_JSON); 

        let replyMessage = `**Songs from ${realName}:**\n`;
        replyMessage += "```"; 
        replyMessage += `| No. | Song Title                                         | Date Added  | Song Popularity |\n`;
        replyMessage += `| --- | -------------------------------------------------- | ----------- | --------------- |\n`;
        sortedList.forEach((entry, index) => {
            const song_name = entry.track.name;
            const dateAdded = entry.added_at; 
            const formattedDate = new Date(dateAdded).toLocaleDateString(); // Format the date
            const popularity = entry.track.popularity;
            replyMessage += `| ${String(index + 1).padEnd(3)} | ${song_name.padEnd(50)} | ${formattedDate.padEnd(11)} | ${popularity.toString().padEnd(15)} |\n`;
        });
        replyMessage += "```";
        await interaction.reply(replyMessage);
    }
    if (interaction.commandName === 'leaderboards') {
        const option = interaction.options.get('category').value;
        const scores = await sortedSongs(option);
        let replyMessage;
        if (option === 'popularity'){
            replyMessage = `**Everyone's Average Song Popularity:**\n`;
            replyMessage += `*(The popularity of a track is a value between 0 and 100, with 100 being the most popular)*`
            replyMessage += "```";
            replyMessage += `| Name          | Song Popularity |\n`;
            replyMessage += `| ------------- | --------------- |\n`;
            scores.forEach(({ name, score, displayScore }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(15)} |\n`;
            });
        } else if(option === 'duration'){
            replyMessage = `**Everyone's Average Song Length (in seconds):**\n`;
            replyMessage += "```";
            replyMessage += `| Name          | Avg Song Length |\n`;
            replyMessage += `| ------------- | --------------- |\n`;
            scores.forEach(({ name, score, displayScore }) => {
                replyMessage += `| ${name.padEnd(13)} | ${displayScore.toString().padEnd(15)} |\n`;
            });
        } else if(option === 'added'){
            replyMessage = `**Everyone's Number of Added Songs:**\n`;
            replyMessage += "```";
            replyMessage += `| Name          | Songs Added |\n`;
            replyMessage += `| ------------- | ----------- |\n`;
            scores.forEach(({ name, score }) => {
                replyMessage += `| ${name.padEnd(13)} | ${score.toString().padEnd(11)} |\n`;
            });
        } else{ 
            replyMessage = `**Overall Leaderboard:**\n`;
            replyMessage += "```";
            replyMessage += `| Name          | Songs Added | Avg Song Length | Song Popularity |\n`;
            replyMessage += `| ------------- | ----------- | --------------- | --------------- |\n`;
            scores.forEach(({ name, songs_added, duration, popularity }) => {
                replyMessage += `| ${name.padEnd(13)} | ${songs_added.toString().padEnd(11)} | ${duration.toString().padEnd(15)} | ${popularity.toString().padEnd(15)} |\n`;
            });
        }
        replyMessage += "```";
        await interaction.reply(replyMessage);
    }
    if(interaction.commandName === 'hall_of_fame'){
        sendTextFile(interaction, 'src/Weekly Results/winners.txt')
    }
    if(interaction.commandName === 'hall_of_shame'){
        sendTextFile(interaction, 'src/Weekly Results/losers.txt')
    }
})

client.login(process.env.DISCORD_BOT_TOKEN);