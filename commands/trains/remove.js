const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const readJson = require('../../functions/readJson');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-train')
        .setDescription('Remove um comboio da tua lista.')
        .addIntegerOption(option =>
            option
                .setName('trainid')
                .setDescription('ID do comboio')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('station')
                .setDescription('Nome da estação')
                .setRequired(true)
                .setAutocomplete(true)
            /*                 .addChoices(
                                { name: 'Benfica', value: '9460046' },
                                { name: 'Estação 2', value: '9431237' },
                                { name: 'Estação 3', value: '9431070' }
                            ) */
        ),

    async execute(client, interaction) {
        const user = interaction.user.id;
        const trainId = interaction.options.getInteger('trainid');
        const stationNameString = interaction.options.getString('station'); // Obtém o nome da estação
        const stationName = parseInt(stationNameString);

        // Lê o arquivo trains.json
        const trains = JSON.parse(fs.readFileSync('./database/trains.json'));

        // Procura o utilizador na base de dados dos comboios
        const userTrains = trains[user];

        if (!userTrains) {
            return await interaction.reply({
                content: 'Não encontrei nenhum comboio associado a ti.',
                ephemeral: true
            });
        }

        // Percorre o array de dados do utilizador
        for (let i = 0; i < userTrains.data.length; i++) {
            const train = userTrains.data[i];
            if (train.trainId === trainId && train.stationName === stationName) {
                // Remove o nó correspondente ao trainId e stationName
                userTrains.data.splice(i, 1);
                fs.writeFileSync('./database/trains.json', JSON.stringify(trains, null, 2));
                return await interaction.reply({
                    content: 'O comboio foi removido com sucesso.',
                    ephemeral: true
                });
            }
        }
        return await interaction.reply({
            content: 'Não encontrei nenhum comboio com os detalhes especificados.',
            ephemeral: true
        });
    }
};