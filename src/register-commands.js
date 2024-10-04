import dotenv from 'dotenv'; 
import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';

dotenv.config();

const commands = [
    {
        name: 'hall_of_fame',
        description: 'Our voted best songs every week',
    },
    {
        name: 'hall_of_shame',
        description: 'Our voted worst songs every week',
    },
    {
        name: 'leaderboards',
        description: 'Number of songs contributed from everyone',
        options: [
            {
                name: 'category',
                description: 'Pick what you wanna filter by',
                type: ApplicationCommandOptionType.String,
                required : true,
                choices:[
                    {
                        name: 'Overall',
                        value: 'overall',
                    },
                    {
                        name: 'Songs Added',
                        value: 'added',
                    },
                    {
                        name: 'Song Length',
                        value: 'duration',
                    },
                    {
                        name: 'Song Popularity',
                        value: 'popularity',
                    },                   
                ],
            },

        ],
    },
    {
        name: 'songs',
        description: 'Songs added from user. /songs <user>',
        options: [
            {
                name: 'username',
                description: 'the user',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
        ],
    },
];

const rest = new REST({ version : '10'}).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            {body: commands}
        );
        console.log('Slash commands were registered successfully!');
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();
