const { Events } = require('discord.js');
const checkTrains = require('../functions/checkTrains');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        setInterval(() => {
            console.log("object");
            checkTrains(client);
        },  10 * 1000);
    },
};