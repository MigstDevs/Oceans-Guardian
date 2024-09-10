import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from 'dotenv';
import express from 'express';

config(); // Load environment variables from .env file
const app = express();
const token = process.env.token;
const clientId = process.env.clientId;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});

app.listen(3000, () => {
  console.log("🎉 Bot do Sorteio online!");
});

app.get("/", (req, res) => {
  res.send("Bot do Sorteio está vivo!");
});

// Store active giveaways
let giveaways = {};

client.on("ready", () => {
  console.log(`🟢 Bot conectado como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  if (interaction.isCommand()) {
    const { commandName, options } = interaction;

    if (commandName === 'sorteio') {
      const title = options.getString('titulo') || 'Sorteio';
      const description = options.getString('descricao') || 'Participe agora!';
      const duration = options.getInteger('duracao') || 60; // Minutos
      const winners = options.getInteger('vencedores') || 1;
      const imageUrl = options.getString('imagem');

      const endTime = Date.now() + duration * 60 * 1000;
      const participants = [];

      let embed = new EmbedBuilder()
        .setTitle(`🎉 **${title}** 🎉`)
        .setDescription(`📋 ${description}\n⏳ **Termina em:** ${duration} minutos\n🏆 **Vencedores:** ${winners}`)
        .setColor(0xffc107)
        .setFooter({ text: 'Participe do sorteio clicando no botão abaixo!' })
        .setTimestamp(endTime); // Add end time to embed

      if (imageUrl) {
        embed.setImage(imageUrl);
      }

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('participar_sorteio')
            .setLabel('🎊 Participar')
            .setStyle(ButtonStyle.Success)
        );

      const message = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      // Store giveaway data
      giveaways[message.id] = {
        title,
        description,
        winners,
        endTime,
        participants,
        messageId: message.id,
        channelId: message.channel.id
      };

      // End giveaway after specified duration
      setTimeout(() => endGiveaway(message.id), duration * 60 * 1000);
    }
  }

  // Handle button interaction
  if (interaction.isButton() && interaction.customId === 'participar_sorteio') {
    const giveaway = giveaways[interaction.message.id];
    if (!giveaway) {
      return interaction.reply({ content: 'Esse sorteio já acabou.', ephemeral: true });
    }

    if (!giveaway.participants.includes(interaction.user.id)) {
      giveaway.participants.push(interaction.user.id);
      interaction.reply({ content: '🎉 Você entrou no sorteio com sucesso!', ephemeral: true });
    } else {
      interaction.reply({ content: '❌ Você já está participando desse sorteio.', ephemeral: true });
    }
  }
});

async function endGiveaway(messageId) {
  const giveaway = giveaways[messageId];
  if (!giveaway) return;

  const channel = await client.channels.fetch(giveaway.channelId);
  const message = await channel.messages.fetch(giveaway.messageId);

  if (giveaway.participants.length === 0) {
    await message.edit({
      embeds: [new EmbedBuilder()
        .setTitle(`🎉 **${giveaway.title}** 🎉`)
        .setDescription(`${giveaway.description}\n\n❌ **Ninguém participou!**`)
        .setColor(0xff0000)
        .setFooter({ text: 'O sorteio terminou.' })],
      components: []
    });
    delete giveaways[messageId];
    return;
  }

  const winnerIds = [];
  while (winnerIds.length < giveaway.winners && giveaway.participants.length > 0) {
    const randomIndex = Math.floor(Math.random() * giveaway.participants.length);
    const winnerId = giveaway.participants.splice(randomIndex, 1)[0];
    winnerIds.push(`<@${winnerId}>`);
  }

  await message.edit({
    embeds: [new EmbedBuilder()
      .setTitle(`🎉 **${giveaway.title}** 🎉`)
      .setDescription(`${giveaway.description}\n\n🏆 **Vencedores:** ${winnerIds.join(', ')}`)
      .setColor(0x00ff00)
      .setFooter({ text: 'O sorteio terminou.' })],
    components: []
  });

  delete giveaways[messageId];
}

client.login(token);