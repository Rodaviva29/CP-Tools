const { Partials, GatewayIntentBits, Client, Collection, } = require('discord.js');
const handler = require('./handlers');
const { token } = require('./config.json');

const client = new Client({
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction
    ],

    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

handler.LoadEvents(client);
handler.LoadCommands(client);

client.login(token);