const { EmbedBuilder } = require('discord.js');
const readJson = require('../functions/readJson');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const moment = require('moment-timezone');
const formatStationName = require('../functions/formatStationName');
const fs = require('fs');

module.exports = async function checkTrains(client) {
    const trains = readJson('./database/trains.json');

    // const today = new Date().toISOString().split('T')[0]; // "2023-03-25"
    // console.log(today)

    const now = new Date(Date.now() + 3600000);
    now2 = now.toISOString().split('T')[0];

    const [year, month, day] = now2.split('-');
    const dateString = `${year}-${month}-${day}`; // "2023-03-25"

    console.log(dateString)

    for (const userId in trains) {
        const user = await client.users.fetch(userId);

        if (!trains[userId].active_all) {
            continue;
        }

        const userTrains = trains[userId].data;
        for (const train of userTrains) {

            const trainId = train.trainId;
            const response = await fetch(`https://www.infraestruturasdeportugal.pt/negocios-e-servicos/horarios-ncombio/${trainId}/${dateString}`);
            //const response = await fetch(`https://pastebin.com/raw/Y88cpxbN`);
            //console.log(response)
            const data = await response.json();

            const situacao = data.response.SituacaoComboio;
            console.log(situacao)

            if (situacao === 'Realizado') {
                if (train.lastDate !== dateString) {

                    try {
                        await user.send({
                            embeds: [new EmbedBuilder()
                                .setTitle(`Comboio no destino!`)
                                .setDescription(`Que boa viagem! O comboio ${trainId} chegou com sucesso ao seu destino.`)
                                .setColor('#00bef7')
                                .setTimestamp()
                            ]
                        });
                    } catch (error) {
                        console.log(error.message);
                    }

                    // Atualiza no JSON a data para corresponder na DateString.
                    train.lastDate = dateString;
                    trains[userId].data[userTrains.indexOf(train)] = train;
                    fs.writeFileSync('./database/trains.json', JSON.stringify(trains));
                }
            } else if (situacao === 'SUPRIMIDO') {
                if (train.lastDate !== dateString) {

                    const stationName = train.stationName;
                    const nodes = data.response.NodesPassagemComboio;
                    let node;
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].NodeID === stationName) {
                            node = nodes[i];
                            break;
                        }
                    }

                    if (node) {
                        const horaProgramada = node.HoraProgramada;
                        const NomeEstacao = node.NomeEstacao;

                        try {
                            await user.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(`Comboio suprimido: ${trainId}`)
                                        .setDescription(`Lamentamos informar que o comboio ${trainId} com hora programada de chegada às ${horaProgramada} em ${formatStationName(NomeEstacao)} foi suprimido. Recomendamos verificar alternativas para a sua viagem!`)
                                        .setColor('#ff0000')
                                        .setTimestamp()
                                ]
                            });
                        } catch (error) {
                            console.log(error.message);
                        }

                        // Atualiza no JSON a data para corresponder na DateString.
                        train.lastDate = dateString;
                        trains[userId].data[userTrains.indexOf(train)] = train;
                        fs.writeFileSync('./database/trains.json', JSON.stringify(trains));
                    }
                }
            } else if (situacao === null) {
                console.log("Não foi possível encontrar o comboio para este dia / inexistente.")
            } else if (situacao.includes('com atraso previsto')) {
                const stationName = train.stationName;
                const nodes = data.response.NodesPassagemComboio;
                let node;
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].NodeID === stationName) {
                        node = nodes[i];
                        break;
                    }
                }
                if (node) {
                    const nodeID = node.NodeID;
                    const horaPrevista = node.Observacoes.slice(14);
                    const horaProgramada = node.HoraProgramada;
                    const NomeEstacao = node.NomeEstacao;

                    console.log(`O comboio com atraso previsto na estação com ID: ${stationName}|${nodeID}|${formatStationName(NomeEstacao)}, possui previsão de chegada às ${horaPrevista}. (O comboio deveria chegar às: ${horaProgramada})`);

                    if (nodeID === train.stationName && horaPrevista !== train.lastEdit) {

                        try {
                            await user.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(`Atraso previsto: ${formatStationName(NomeEstacao)} (${trainId})`)
                                        .setDescription(`O comboio ${trainId} em ${formatStationName(NomeEstacao)} tem um atraso previsto com nova hora de chegada: **${horaPrevista}**.\n(O comboio deveria chegar às: ${horaProgramada})`)
                                        .setColor('#ffa500')
                                        .setTimestamp()
                                ]
                            });
                        } catch (error) {
                            console.log(error.message);
                        }
                        // Atualiza no JSON a data para corresponder na DateString.
                        train.lastEdit = horaPrevista;
                        trains[userId].data[userTrains.indexOf(train)] = train;
                        fs.writeFileSync('./database/trains.json', JSON.stringify(trains));
                    }
                } else {
                    console.log(`Não foi possível encontrar informações para a estação ${stationName}.`);
                }
            } else if (situacao === '' || situacao === "Programado") {
                const stationName = train.stationName;
                const nodes = data.response.NodesPassagemComboio;
                let node;
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].NodeID === stationName) {
                        node = nodes[i];
                        break;
                    }
                }
                if (node) {
                    const nodeID = node.NodeID;
                    const horaProgramada = node.HoraProgramada;

                    const NomeEstacao = node.NomeEstacao;

                    console.log(`O comboio está com a sua circulação normalizada na estação com ID: ${stationName}|${nodeID}|${formatStationName(NomeEstacao)}, possui previsão de chegada às ${horaProgramada}.`);

                    const horaAtual = moment().tz('Europe/Lisbon').format('HH:mm');

                    console.log(horaAtual)

                    const diferencaHoras = moment(horaProgramada, 'HH:mm').diff(moment(horaAtual, 'HH:mm'), 'minutes');

                    console.log(diferencaHoras)

                    if (diferencaHoras <= 25 && diferencaHoras > 10) {
                        if (train.lastCheck !== `${dateString}-1`) {

                            console.log('Enviar notificação para o utilizador com 25 minutos de antecedência.');

                            try {
                                await user.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle('Lembrete [1/2]')
                                            .setDescription(`O comboio ${trainId} está com a sua circulação normalizada com previsão de chegada ás ${horaProgramada} na tua estação de preferência: ${formatStationName(NomeEstacao)}.`)
                                            .setColor('#74b454')
                                            .setTimestamp()
                                    ]
                                });
                            } catch (error) {
                                console.log(error.message);
                            }

                            train.lastCheck = `${dateString}-1`;
                            trains[userId].data[userTrains.indexOf(train)] = train;
                            fs.writeFileSync('./database/trains.json', JSON.stringify(trains));
                        }

                    } else if (diferencaHoras <= 10 && diferencaHoras > 0) {
                        if (train.lastCheck !== `${dateString}-0`) {

                            console.log('Enviar notificação para o utilizador com 10 minutos de antecedência');

                            try {
                                await user.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle('Lembrete [2/2]')
                                            .setDescription(`O comboio ${trainId} está com a sua circulação normalizada com previsão de chegada ás ${horaProgramada} na tua estação de preferência: ${formatStationName(NomeEstacao)}.`)
                                            .setColor('#74b454')
                                            .setTimestamp()
                                    ]
                                });
                            } catch (error) {
                                console.log(error.message);
                            }

                            train.lastCheck = `${dateString}-0`;
                            trains[userId].data[userTrains.indexOf(train)] = train;
                            fs.writeFileSync('./database/trains.json', JSON.stringify(trains));
                        }
                    }
                }
            } else {
                console.log(`Não foi possível encontrar informações para o comboio.`);
            }
        }
    }
}
