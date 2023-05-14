const { Events, InteractionType } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        if (!interaction.guild) return interaction.reply(`You cannot user commands here!`);

        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(client, interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }


        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            const { name, value } = interaction.options.getFocused(true)
            const allStations = require('../database/stations.json');

            if (name === "station" || name === "nome") {
                await interaction.respond(allStations.map(station => ({
                    name: `${station.name}`,
                    value: `${station.value}`
                })));
            }
        }
    },
};
