const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!!'),
    async execute(client, interaction) {
        await interaction.deferReply();

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`${client.ws.ping}`)
            ]
        })
    },
};