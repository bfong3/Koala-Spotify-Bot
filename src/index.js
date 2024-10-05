import dotenv from 'dotenv'; 
import * as utils from './utils/index.js';
import { getPlaylistData } from './Spotify Code/app.js';
import { Client, IntentsBitField } from 'discord.js';

dotenv.config();

const ID_DICTIONARY = {
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

const client = new Client({intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
],
});

let playlist_JSON;

client.on('ready', async (c) => {
    console.log(`${c.user.tag} is ready.`);
    playlist_JSON = await getPlaylistData()
});

client.on('interactionCreate', async (interaction) =>{
    if(!interaction.isChatInputCommand()) return;

    if(interaction.commandName === 'songs'){
        utils.printSongsFromUser(interaction, ID_DICTIONARY, playlist_JSON);
    }
    if (interaction.commandName === 'leaderboards') {
        const option = interaction.options.get('category').value;
        const scores = await utils.sortedSongs(option, ID_DICTIONARY, playlist_JSON);
        await utils.displayLeaderboard(interaction, option, scores);
    }
    if(interaction.commandName === 'hall_of_fame' || interaction.commandName === 'hall_of_shame'){
        const currentWeek = utils.calculateCurrentWeek(ID_DICTIONARY, playlist_JSON)
        //const currentWeek = 3;
        utils.displayFileContents(interaction, interaction.commandName, currentWeek);
    }
})

client.login(process.env.DISCORD_BOT_TOKEN);