const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { config } = require('dotenv');
const { setTimeout } = require('node:timers/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const express = require('express');

config(); // Load environment variables
const app = express();

const token = process.env.token;
const clientId = process.env.clientId;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

app.listen(3000, () => {
  console.log("ah");
});

app.get("/", (req, res) => {
  res.send("bah");
});

const commands = [
  {
    name: 'sorteio',
    description: 'Inicia um sorteio!',
    options: [
      {
        name: 'titulo',
        description: 'Título do sorteio',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'duracao',
        description: 'Duração do sorteio em minutos',
        type: 4, // INTEGER
        required: true,
      },
      {
        name: 'vencedores',
        description: 'Número de vencedores',
        type: 4, // INTEGER
        required: true,
      },
      {
        name: 'descricao',
        description: 'Descrição do sorteio',
        type: 3, // STRING
        required: false,
      },
      {
        name: 'imagem',
        description: 'URL da imagem para o sorteio',
        type: 3, // STRING
        required: false,
      },
    ],
  },
];


const rest = new REST({ version: "10" }).setToken(token);

client.on('ready', async () => { 
  console.log(`O bot está online como ${client.user.tag}`);
  try {
    console.log("Comecei a atualizar os comandos barra.");
    await rest.put(Routes.applicationCommands(clientId), {      
      body: commands,
    });

    console.log("Terminei de atualizar os comandos barra.");
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'sorteio') {
    const title = options.getString('titulo');
    const description = options.getString('descricao') || 'Nenhuma descrição fornecida.';
    const duration = options.getInteger('duracao');
    const winners = options.getInteger('vencedores');
    const imageUrl = options.getString('imagem') || 'https://via.placeholder.com/500';

    const endTime = new Date(Date.now() + duration * 60000);
    const remainingTime = Math.ceil((endTime - Date.now()) / 60000);

    const giveawayEmbed = new EmbedBuilder()
      .setTitle(`🎉 Sorteio: ${title}`)
      .setDescription(description)
      .setColor(0x00FF00)
      .setImage(imageUrl)
      .addFields(
        { name: '⏳ Duração', value: `Termina em ${remainingTime} minuto(s)`, inline: true },
        { name: '🏆 Vencedores', value: `${winners}`, inline: true }
      )
      .setFooter({ text: `Participar clicando no botão abaixo!` });

    const participateButton = new ButtonBuilder()
      .setCustomId('participar_sorteio')
      .setLabel('🎊 Participar')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(participateButton);

    await interaction.reply({ embeds: [giveawayEmbed], components: [row] });

 // Set a timeout to close the giveaway after the duration
    await setTimeout(duration * 60000);
    await interaction.editReply({ content: '⏳ O sorteio terminou!', components: [] });
  }
});

client.login(token);
