const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notifications-toggle')
        .setDescription('Ativa/desativa o acompanhamento de todos os comboios.')
        .addStringOption(option =>
            option.setName('active')
                .setDescription('Ativa ou desativa o acompanhamento de todos os comboios.')
                .addChoices(
                    { name: 'Ligar Notificações', value: 'on' },
                    { name: 'Pausar Notificações', value: 'off' }
                )
                .setRequired(true)),

    async execute(client, interaction) {
        const activeChoice = interaction.options.getString('active') ?? true;
        const userId = interaction.user.id;

        // Mapeia a escolha do usuário com um valor booleano
        let active = false;
        if (activeChoice === 'on') {
            active = true;
        }

        // Lê o arquivo trains.json
        const trains = JSON.parse(fs.readFileSync('./database/trains.json'));

        // Altera o valor de active_all para o valor especificado
        if (trains[userId]) {
            trains[userId].active_all = active;
        } else {
            trains[userId] = {
                active_all: active,
                data: []
            };
        }

        // Salva as alterações no arquivo trains.json
        fs.writeFileSync('./database/trains.json', JSON.stringify(trains, null, 2));

        // Envia uma resposta (Sistema de Notificações Ligadas / Desligadas)
        await interaction.reply({ content: `O acompanhamento de todos os comboios foi ${active ? 'ativado' : 'desativado'}.`, ephemeral: true });
    },
};