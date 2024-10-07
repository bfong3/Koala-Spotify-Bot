import dotenv from 'dotenv'; 
import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';

dotenv.config();

const commands = [
    {
        name: 'hall_of_fame',
        description: 'Our most favorite song every week',
        options: [
            {
                name: 'specify',
                description: 'Display entire file or specific week',
                type: ApplicationCommandOptionType.String, 
                choices: [
                    {
                        name: 'All',
                        value: 'all', 
                    },
                    {
                        name: 'Week',
                        value: 'week',
                    },
                ],
                required: true, 
            },
            {
                name: 'number',
                description: 'Specific week number',
                type: ApplicationCommandOptionType.Number,
                required: false,
            },
        ],        
    },
    {
        name: 'hall_of_shame',
        description: 'Our least favorite song every week',
        options: [
            {
                name: 'specify',
                description: 'Display entire file or specific week',
                type: ApplicationCommandOptionType.String, 
                choices: [
                    {
                        name: 'All',
                        value: 'all', 
                    },
                    {
                        name: 'Week',
                        value: 'week',
                    },
                ],
                required: true, 
            },
            {
                name: 'number',
                description: 'Specific week number',
                type: ApplicationCommandOptionType.Number,
                required: false,
            },
        ],    
    },
    {
        name: 'leaderboards',
        description: 'Number of songs contributed from everyone',
        options: [
            {
                name: 'category',
                description: 'Leaderboard of different categories',
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
        description: 'Songs added from specified user',
        options: [
            {
                name: 'username',
                description: 'the user',
                type: ApplicationCommandOptionType.User, // Ensure this type is defined in your version
                required: true,
            },
        ],
    },
    {
        name: 'missing',
        description: 'Check missing songs this week',
    },
];

const rest = new REST({ version : '10'}).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        const guildIds = [process.env.MYSERVER_GUILD_ID, process.env.KOALA_GUILD_ID];
        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands }
            );
        }
        console.log('Slash commands were registered successfully!');
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();
