import dotenv from 'dotenv'; 
import * as utils from './utils/index.js';
import { exportSongs } from './Google Forms/index.js'
import { getPlaylistData } from './Spotify Code/app.js';
import { Client, IntentsBitField } from 'discord.js';

dotenv.config();

const DISCORD_ID_DICTIONARY = {
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
    '198338583260692482': { realName: 'Michael', spotifyId: '22ykd3a2sxif3tudh2rhn7nhy' },
    '216377314982756356': { realName: 'Ranen', spotifyId: '22vfgrxvdndvgnyz7bj5zv4di' },
    '153665486494629888': { realName: 'Ryan', spotifyId: 'fax416ds7nujqx58lirt8yz3j' },
    '153579334286835712': { realName: 'Shawn', spotifyId: '1265167543' },
    '183771302828572672': { realName: 'Spencer', spotifyId: '1245414659' },
    '143083192159698944': { realName: 'Zhao', spotifyId: 'bb3amt8y4jl2pakk857soxwly' }
};

let entirePlaylist;

const client = new Client({intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
],
});

function getRules() {
    return (
        "**Rule 1**: Add your new song(s) to the playlist between every Tuesday and Wednesday. You can make changes to your song selection(s) during this time.\n" +
        "**Rule 2**: No duplicate, meme, or previously voted off songs.\n" + 
        "**Rule 3**: If a song and its remix are both submitted, only one version can remain in the playlist.\n" + 
        "**Rule 4**: Every Monday, we vote for the most and least favorite songs of the week. The most favorite must be from the current week, while the least favorite can be from any week.\n" +
        "**Rule 5**: The least favorite song will be removed, and the winner of the most favorite adds an extra song the following week."
    );
}

function help() {
    return (
        "**/leaderboards <category>**: Display leaderboard for selected category.\n" +
        "**/songs <user>**: Shows all added songs from the user.\n" + 
        "**/missing**: Check who hasn't added their songs for this week.\n" + 
        "**/rules**: Our server's rules for adding/voting songs.\n" +
        "**/update**: Updates bot with any changes from the Spotify Playlist.\n" +
        "**/week <number> **: Shows all songs from specified week."
    );
}

async function update()  {
    const pulledPlaylist = await getPlaylistData();
    const currentWeek = utils.getCurrentWeek();
    await utils.updateStoredSongs(currentWeek, DISCORD_ID_DICTIONARY, pulledPlaylist); //Update with all songs added this week
    entirePlaylist = await utils.loadStoredSongs();
    exportSongs(); // For Google Forms 
}

client.on('ready', async (c) => {
    update();
    //console.log(entirePlaylist);
    console.log(`${c.user.tag} is ready.`);
});

client.on('interactionCreate', async (interaction) =>{
    //console.log("Interaction received:", interaction);
    if(!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
        case 'songs':
            await utils.printSongsFromUser(interaction, DISCORD_ID_DICTIONARY, entirePlaylist);
            break;
    
        case 'leaderboards':
            const leaderboard = utils.displayLeaderboard(interaction, DISCORD_ID_DICTIONARY, entirePlaylist);
            await interaction.reply(leaderboard);
            break;
    
        case 'hall_of_fame':
        case 'hall_of_shame':
            const file = await utils.getFileContents(interaction.commandName);
            await interaction.reply({ files: [file] });
            break;
        
        case 'help':
            await interaction.reply(help());  
            break;

        case 'rules':
            await interaction.reply(getRules());
            break;
    
        case 'missing':
            const currentWeekNumber = utils.getCurrentWeek();
            const latestWinnerDiscordID = await utils.getDiscordID(interaction, "winner", currentWeekNumber - 1, DISCORD_ID_DICTIONARY, currentWeekNumber);
            utils.replyAllMissingSongs(interaction, latestWinnerDiscordID, currentWeekNumber, DISCORD_ID_DICTIONARY, entirePlaylist);
            break;
    
        case 'update':
            update();
            await interaction.reply("Songs successfully updated.");
            break;
    
        case 'week':
            const weekNumber = interaction.options.getNumber('week_number'); 
            await utils.printSongsFromWeek(interaction, DISCORD_ID_DICTIONARY, entirePlaylist, weekNumber);
            break;
    }
})

client.login(process.env.DISCORD_BOT_TOKEN);

export { DISCORD_ID_DICTIONARY, entirePlaylist };