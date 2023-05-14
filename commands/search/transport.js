const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const formatStationName = require('../../functions/formatStationName');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transporte') // Adiciona o nome do comando
        .setDescription('Procurar informações do trajeto de um transporte.')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('O ID do transporte associado.')
                .setRequired(true)),

    async execute(client, interaction) {
        const id = interaction.options.getInteger('id') || '';
        const today = new Date().toISOString().split('T')[0]; // "2023-03-25"
        const [year, month, day] = today.split('-');
        const formattedDate = `${year}-${month}-${day}`; // "2023-03-25"

        // Dados do Site (fetching) com ID associado ao comando /transporte e com a data formatada de acordo com o código acima.
        const response = await fetch(`https://www.infraestruturasdeportugal.pt/negocios-e-servicos/horarios-ncombio/${id}/${formattedDate}`);

        const data = await response.json(); // Converte o conteúdo em JSON

        // Verifica se o conteúdo retornado é igual ao valor esperado.
        const expectedContent = '{"response":{"DataHoraDestino":null,"DataHoraOrigem":null,"Destino":null,"DuracaoViagem":null,"NodesPassagemComboio":null,"Operador":null,"Origem":null,"SituacaoComboio":null,"TipoServico":null}}';
        if (JSON.stringify(data) === expectedContent) {
            // Define a mensagem embed como a mensagem personalizada.
            const embed = {
                color: 0xff0000,
                title: `Não foi possível encontrar informações relativamente a esse trajeto (${id}).`,
            };
            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
            return;
        }

        // Extrai apenas os primeiros 16 caracteres da string de DataHoraOrigem.
        data.response.DataHoraOrigem = data.response.DataHoraOrigem.slice(0, 16);
        data.response.DataHoraDestino = data.response.DataHoraDestino.slice(0, 16);

        // Define a cor do embed de acordo com a situação do comboio
        let color = 0x74b454; // Cor verde padrão
        const situacaoComboio = data.response.SituacaoComboio;

        if (situacaoComboio === "SUPRIMIDO") {
            color = 0xff0000; // Cor vermelha para comboios suprimidos
        } else if (situacaoComboio.startsWith("Em circulação (com atraso)")) {
            color = 0xffa500; // Cor laranja para comboios em circulação com atraso
        } else if (situacaoComboio === "Realizado") {
            color = 0x00bef7; // Cor verde para comboios realizados
        }

        // Cria a mensagem embed com as informações do comboio
        const embed = {
            color: color,
            title: `Informações do Trajeto do Comboio #${id}`,
            fields: [
                {
                    name: 'Tipo do Comboio',
                    value: data.response.TipoServico,
                    inline: true,
                },
                {
                    name: 'Ponto de Partida',
                    value: formatStationName(data.response.Origem),
                    inline: true,
                },
                {
                    name: 'Ponto de Destino',
                    value: formatStationName(data.response.Destino),
                    inline: true,
                },
                {
                    name: 'Tempo da Viagem',
                    value: data.response.DuracaoViagem,
                    inline: true,
                },
                {
                    name: 'Hora de Partida',
                    value: data.response.DataHoraOrigem,
                    inline: true,
                },
                {
                    name: 'Hora de Chegada',
                    value: data.response.DataHoraDestino,
                    inline: true,
                },
                {
                    name: 'Situação do Comboio',
                    value: data.response.SituacaoComboio ? formatStationName(data.response.SituacaoComboio) : 'Circulação normalizada'
                },
            ],
        };

        // Adiciona as informações do trajeto do comboio
        const nodesPassagemComboio = data.response.NodesPassagemComboio;
        let trajeto = '';
        for (let j = 0; j < nodesPassagemComboio.length; j++) {
            const node = nodesPassagemComboio[j];
            trajeto += `**${j + 1}.** ${formatStationName(node.NomeEstacao)} (_${node.HoraProgramada}_)\n`;
            // trajeto += `**Hora Programada:** ${node.HoraProgramada}\n`;
            // trajeto += `**Comboio Passou:** ${node.ComboioPassou}\n`;
            if (node.Observacoes) {
                trajeto += `   **OBS:** ${node.Observacoes}\n`;
            }
            trajeto += '\n';
        }
        if (trajeto) {
            embed.fields.push({
                name: `Estações e Horas Programadas do Trajeto`,
                value: trajeto,
            });
        }
        // Enviar a mensagem embed como resposta à interação do comando /transporte
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};