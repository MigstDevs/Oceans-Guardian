const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, AttachmentBuilder } = require('discord.js');
const { config } = require('dotenv');
const { setTimeout } = require('node:timers/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const express = require('express');
const { formatDuration } = require('discord.js');

config(); // Load environment variables
const app = express();

const token = process.env.token;
const clientId = process.env.clientId;
const specialRoleId = '1271244040289124395'; // Special role ID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.get("/", (req, res) => {
  res.send("Server is running.");
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
        description: 'Imagem para o sorteio (anexo)',
        type: 11, // ATTACHMENT
        required: false,
      },
    ],
  },
  {
    name: 'reroll',
    description: 'Refaz o sorteio para novos vencedores!',
    options: [
      {
        name: 'message_id',
        description: 'ID da mensagem do sorteio',
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(token);

const activeGiveaways = new Collection(); // Stores active giveaways and participants

client.on('ready', async () => {
  console.log(`O bot está online como ${client.user.tag}`);
  try {
    console.log("Atualizando os comandos de barra.");
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    console.log("Comandos de barra atualizados.");
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  // Handle giveaway command
  if (interaction.isCommand()) {
    const { commandName, options } = interaction;

    if (commandName === 'sorteio') {
      const title = options.getString('titulo');
      const description = options.getString('descricao') || 'Nenhuma descrição fornecida.';
      const duration = options.getInteger('duracao');
      const winners = options.getInteger('vencedores');
      const imageUrl = options.getString('imagem') || null;

      const giveawayId = `giveaway-${interaction.id}`;
      const participants = new Set();

      const endTime = Date.now() + duration * 60000;

      const giveawayEmbed = new EmbedBuilder()
        .setTitle(`**${title}**`)
        .setDescription(description)
        .setColor(0x00FF00)
        .setFooter({ text: `Participar clicando no botão abaixo!` });

      if (imageUrl) {
        giveawayEmbed.setImage(imageUrl);
      }

      const participateButton = new ButtonBuilder()
        .setCustomId(giveawayId)
        .setLabel('🎊 Participar')
        .setStyle(ButtonStyle.Primary);

      const participantsButton = new ButtonBuilder()
        .setCustomId(`${giveawayId}_participants`)
        .setLabel('🧑Participantes')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(participateButton, participantsButton);

      await interaction.reply({ embeds: [giveawayEmbed], components: [row] });

      // Store the giveaway information
      activeGiveaways.set(giveawayId, { participants, winners, endTime, interaction });
    }

    // Handle reroll command
    if (commandName === 'reroll') {
      const messageId = options.getString('message_id');
      const targetMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);

      if (!targetMessage) {
        return interaction.reply({ content: 'Mensagem de sorteio não encontrada!', ephemeral: true });
      }

      const giveawayData = Array.from(activeGiveaways.values()).find(g => g.interaction.id === messageId);

      if (!giveawayData) {
        return interaction.reply({ content: 'Este sorteio não possui dados de participantes ou já terminou.', ephemeral: true });
      }

      const participantList = Array.from(giveawayData.participants);
      if (participantList.length === 0) {
        return interaction.reply({ content: 'Nenhum participante encontrado.', ephemeral: true });
      }

      const finalWinners = selectWinners(participantList, giveawayData.winners, interaction.guild);
      const winnerMentions = finalWinners.length
        ? finalWinners.map(w => `<@${w.id}>`).join(', ')
        : 'Nenhum participante.';

      await targetMessage.edit({
        content: `🎉 O sorteio foi refeito! Novos vencedores: ${winnerMentions}`,
      });

      interaction.reply({ content: `O sorteio foi refeito! Novos vencedores: ${winnerMentions}`, ephemeral: true });
    }
  }

  // Handle button interaction for giveaway participants
  if (interaction.isButton()) {
    const giveawayId = interaction.customId.split('_')[0];
    const giveawayData = activeGiveaways.get(giveawayId);

    if (!giveawayData) {
      return interaction.reply({ content: 'O sorteio já terminou.', ephemeral: true });
    }

    const userId = interaction.user.id;
    const participants = giveawayData.participants;

    if (interaction.customId.endsWith('_participants')) {
      const participantList = Array.from(participants);
      const participantMentions = participantList.length
        ? participantList.map(p => `<@${p}>`).join('\n')
        : 'Nenhum participante ainda.';

      await interaction.reply({
        content: `Tem ${participantList.length} participante(s) neste sorteio, que são:\n${participantMentions}`,
        ephemeral: true,
      });
    } else {
      if (participants.has(userId)) {
        participants.delete(userId);
        await interaction.reply({ content: 'Você saiu do sorteio.', ephemeral: true });
      } else {
        participants.add(userId);
        await interaction.reply({ content: 'Você entrou no sorteio.', ephemeral: true });
      }

      // Update the participant count on the "🧑Participantes" button
      const updatedParticipantsButton = new ButtonBuilder()
        .setCustomId(`${giveawayId}_participants`)
        .setLabel(`🧑Participantes (${participants.size})`)
        .setStyle(ButtonStyle.Secondary);

      const updatedParticipateButton = new ButtonBuilder()
        .setCustomId(giveawayId)
        .setLabel('🎊 Participar')
        .setStyle(ButtonStyle.Primary);

      const updatedRow = new ActionRowBuilder().addComponents(updatedParticipateButton, updatedParticipantsButton);

      await interaction.message.edit({
        components: [updatedRow],
      });
    }
  }
});

// Select winners
function selectWinners(participants, numWinners, guild) {
  const winners = [];
  const participantEntries = [];

  participants.forEach(async (participantId) => {
    const member = await guild.members.fetch(participantId).catch(() => null);
    if (member) {
      participantEntries.push(member);
    }
  });

  while (winners.length < numWinners && participantEntries.length > 0) {
    const randomIndex = Math.floor(Math.random() * participantEntries.length);
    const winner = participantEntries.splice(randomIndex, 1)[0];
    winners.push(winner);
  }

  return winners;
}

const fs = require('fs');
const path = './giveaways.json';

// Load existing giveaways or initialize if not present
let giveaways = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {};

function saveGiveaways() {
  fs.writeFileSync(path, JSON.stringify(giveaways, null, 2));
}

// Periodic check for giveaway expiration
setInterval(async () => {
  const now = Date.now();
  for (const [id, data] of Object.entries(giveaways)) {
    if (now >= data.endTime) {
      const winners = selectWinners(Array.from(data.participants), data.winners);
      const winnerMentions = winners.length ? winners.map(w => `<@${w}>`).join(', ') : 'Nenhum participante.';
      const channel = client.channels.cache.get(data.channelId);

      if (channel) {
        const message = await channel.messages.fetch(data.messageId).catch(() => null);
        if (message) {
          await message.edit({ content: `🎉 O sorteio terminou! Vencedores: ${winnerMentions}`, components: [] });
        }
      }

      delete giveaways[id];
      saveGiveaways();
    }
  }
}, 60000); // Check every minute


client.login(token);