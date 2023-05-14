const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('station')
        .setDescription('Mostra informações sobre transporte em uma estação.')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome da estação')
                .setRequired(true)
                .setAutocomplete(true)
/*                 .addChoices(
                    { name: 'Benfica', value: '9460046' },
                    { name: 'Estação 2', value: 'station2' },
                    { name: 'Estação 3', value: 'station3' }
                ) */
        )
        .addStringOption(option =>
            option.setName('hora_inicio')
                .setDescription('Hora de início no formato hh:mm')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('hora_fim')
                .setDescription('Hora de fim no formato hh:mm')
                .setRequired(false)),

    async execute(client, interaction) {
        const stationName = interaction.options.getString('nome');
        let timeStart = interaction.options.getString('hora_inicio');
        let timeEnd = interaction.options.getString('hora_fim');

        // Se hora_inicio e hora_fim não forem definidos, definir timeStart para '00:00' e timeEnd para '23:59'
        // TODO: Colocar a devolver o timeStart a partir do momento que a pessoa executou o comando (horário do comando executado)
        if (!timeStart && !timeEnd) {
            timeStart = '00:00';
            timeEnd = '23:59';
        }

        if (!timeStart && timeEnd) {
            timeStart = '00:00';
        }

        if (timeStart && !timeEnd) {
            timeEnd = '23:59';
        }

        // Faz a requisição com os parâmetros adequados
        const response = await fetch(`https://www.infraestruturasdeportugal.pt/negocios-e-servicos/partidas-chegadas/${stationName}/%20${timeStart}/%20${timeEnd}/INTERNACIONAL,%20ALFA,%20IC,%20IR,%20REGIONAL,%20URB%7CSUBUR,%20ESPECIAL`);

        console.log(response.url); // Print response link in console

        const data = await response.json(); // Converte o conteúdo em JSON

        console.log(data)

        // Verifica se o conteúdo retornado é igual ao valor esperado.
        const expectedContent = '{"response":[]}';
        if (JSON.stringify(data) === expectedContent) {
            // Define a mensagem embed como a mensagem personalizada.
            const embed = {
                color: 0xff0000,
                title: `Não foi possível encontrar informações relativamente a essa pesquisa.`,
            };
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        // TODO: Formatar o Nome da Estação para minuscula (verificar algumas regras do código abaixo)
        const stationName_search = data.response[0].NomeEstacao;

        const embed = {
            title: `Comboios em ${stationName_search}`,
            color: 0x74b454,
            fields: []
        };

        // percorre as tabelas de partidas e chegadas
        const tables = data.response[0].NodesComboioTabelsPartidasChegadas;

        embed.fields.push({ name: "`Comboios de Partidas`", value: "" }); // adiciona o título antes do loop

        // percorre as tabelas de Partida e Chegada separadamente
        for (let i = 0; i < tables.length; i++) {
            const train = tables[i];

            // adiciona as informações do comboio ao embed
            embed.fields.push({
                name: `Comboio ${train.NComboio1}`,
                value: `Origem: ${train.NomeEstacaoOrigem}\nDestino: ${train.NomeEstacaoDestino}\nHora: ${train.DataHoraPartidaChegada}\nOperador: ${train.Operador}\nTipo de Serviço: ${train.TipoServico}` + (train.Observacoes ? `\nObservações: ${train.Observacoes}` : '')
            });
        }

        const tables_2 = data.response[1].NodesComboioTabelsPartidasChegadas;

        embed.fields.push({ name: "`Comboios de Chegadas`", value: "" }); // adiciona o título antes do loop

        for (let j = 0; j < tables_2.length; j++) {
            const train_2 = tables_2[j];

            // adiciona as informações do comboio ao embed
            embed.fields.push({
                name: `Comboio ${train_2.NComboio1}`,
                value: `Origem: ${train_2.NomeEstacaoOrigem}\nDestino: ${train_2.NomeEstacaoDestino}\nHora: ${train_2.DataHoraPartidaChegada}\nOperador: ${train_2.Operador}\nTipo de Serviço: ${train_2.TipoServico}` + (train_2.Observacoes ? `\nObservações: ${train_2.Observacoes}` : '')
            });
        }

        // Enviar a resposta para o canal
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};