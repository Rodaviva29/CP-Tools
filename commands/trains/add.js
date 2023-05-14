const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const allStations = require('../../database/stations.json');
const readJson = require('../../functions/readJson');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-train')
        .setDescription('Adiciona um ID de comboio associado a um utilizador.')
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
                                { name: 'Sintra', value: '9461101' },
                                { name: 'Estação 3', value: '9431070' }
                            ) */
        ),

    async execute(client, interaction) {
        const trainId = interaction.options.getInteger('trainid');
        const userId = interaction.user.id;
        const stationNameString = interaction.options.getString('station'); // Obtém o nome da estação
        const stationName = parseInt(stationNameString);
        const station = allStations.find(station => station.value === stationNameString);

        const trains = readJson('./database/trains.json');
        if (!trains[userId]) {
            trains[userId] = {
                active_all: true,
                data: []
            };
        }

        // Verifica se já existe um registro com o mesmo ID de comboio e estação
        const existingRecord = trains[userId].data.find(record => record.trainId === trainId && record.stationName === stationName);
        if (existingRecord) {
            await interaction.reply({
                content: `O comboio ${trainId} com preferência na estação ${station.name} já está nas tuas preferências!`,
                ephemeral: true
            });
            return;
        }

        // Adiciona o novo registro
        trains[userId].data.push({
            trainId,
            stationName,
            lastDate: "",
            lastEdit: "",
            lastCheck: ""
        });

        // trains[userId].push({ trainId, stationName }); // Já não necessário para o código funcionar. (Adiciona o objeto com o trainID e stationName)
        fs.writeFileSync('./database/trains.json', JSON.stringify(trains));
        await interaction.reply({
            content: `Comboio ${trainId} adicionado com sucesso para a estação ${station.name}.`,
            ephemeral: true
        });

        // Necessário antes de adicionar no JSON fazer uma verificação HTTP para verificar se o ID da estação existe e se a estação existe. Se o resultado não for correto, ou seja, se apresentar uma estrutura json padrão de inexistência, não adicionar na base de dados e limitar e informar o utilizador do acontecimento.
    },
};