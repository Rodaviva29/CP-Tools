const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const allStations = require('../../database/stations.json');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notifications-view')
        .setDescription('Visualiza a lista de comboios em acompanhamento.'),

    async execute(client, interaction) {
        const userId = interaction.user.id;

        // Lê o arquivo trains.json
        const trains = JSON.parse(fs.readFileSync('./database/trains.json'));

        const userData = trains[userId];

        // TODO: Adicionar o /add-train como slash na visualização para fácil acesso.
        if (!userData) {
            return interaction.reply({ content: "Atualmente não estás com nenhum comboio na tua lista de notificações. Adiciona com /add-train!", ephemeral: true });
        }

        const status = userData.active_all ? 'Ativadas' : 'Desativadas';

        const embed = {
            color: 0x74b454,
            title: 'Lista de Comboios e Estações',
            description: `Estado de Notificações: **${status}**.\n\nLista de preferência & notificações:`,
            fields: []
        };

        // Necessário fazer uma conversão do stationName (ID) > stationName (REAL)
        // Conversão feita apartir da visualização do ficheiro de estações e IDs.

        for (const train of userData.data) {
            const station = allStations.find(station => station.value === train.stationName.toString());
            const field = {
                name: `Comboio ${train.trainId}`,
                value: `Estação: ${station.name} | ${station.value}`,
                inline: false
            };
            embed.fields.push(field);
        }

        // Envia a mensagem embed
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};