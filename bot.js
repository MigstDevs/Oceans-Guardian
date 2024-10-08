const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const { config } = require('dotenv');
const { setTimeout } = require('node:timers/promises');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const express = require('express');
const fs = require('fs');

config();
const app = express();

const token = process.env.token;
const clientId = process.env.clientId;
const specialRoleId = '1271244040289124395';

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
        type: 3,
        required: true,
      },
      {
        name: 'duracao',
        description: 'Duração do sorteio em minutos',
        type: 4,
        required: true,
      },
      {
        name: 'vencedores',
        description: 'Número de vencedores',
        type: 4,
        required: true,
      },
      {
        name: 'descricao',
        description: 'Descrição do sorteio',
        type: 3,
        required: false,
      },
      {
        name: 'imagem',
        description: 'Imagem para o sorteio (anexo)',
        type: 11,
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
        type: 3,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(token);

const activeGiveaways = new Collection();

async function assignNitroRole(member) {
  if (member.premiumSince) {
      const role = member.guild.roles.cache.get('1288567291490865152');
      if (!member.roles.cache.has('1288567291490865152')) {
          await member.roles.add(role).catch(console.error);
      }
  }
}

client.on('guildMemberAdd', assignNitroRole);

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

    const guild = client.guilds.cache.get('1269670073912524820');
    const members = await guild.members.fetch();
    members.forEach(assignNitroRole);
});

client.on('messageCreate', async (message) => {
  if (message.content === "ocean's guardian, manda o ticket, valeu") {
    const embed = new EmbedBuilder()
      .setTitle("**TICKETS**")
      .setDescription("<:SoDeBoas:1274163456257556510> Quer suporte? <:EuOdeioMensagens:1271250595378106410> Quer denunciar? 🤝 Quer fazer uma parceria? ✨ Seja o que for, faz um ticket! ✨" +
        "\n\n\n📜 Regras do Ticket 🎟️" +
        "\n\n <:NegativoSenhor:1274158985108389888> **|** Não perca o tempo da staff! Apenas abra os tickets para coisas importantes e não abra o ticket para falar besteiras. Um dia de inatividade no ticket e o ticket se fechará." +
        '\n\n <:Raivosinha:1271250499500249150> **|** Não spamme no ticket! O fato do ticket ser um canal privado, não significa que você pode fazer o que quiser com ele, e também é proibido utilizar tickets para "burlar" as suas permissões (usar um ticket só pra criar um canal é triste).'
      )
      .setColor(0x00008B)
      .setImage('https://cdn.discordapp.com/icons/1269670073912524820/a_d21cbf9eeeca7ac43486245aa890b806.webp?size=512');
    
    const ticketButton = new ButtonBuilder()
    .setCustomId('ticket')
    .setLabel('Criar Ticket!')
    .setEmoji("🎟️")
    .setStyle(ButtonStyle.Success);

    const joinCommunity = new ButtonBuilder()
    .setLabel('Entre na nossa comunidade!')
    .setEmoji("💞")
    .setURL("https://discord.gg/69uVwPR48Y")
    .setStyle(ButtonStyle.Link);
    
    const row = new ActionRowBuilder().addComponents(ticketButton, joinCommunity);

    await message.channel.send({ embeds: [embed], components: [row] });
  } else if (message.content === "-ticketf") {
    const thread = message.channel;

    if (thread.isThread()) {
        await thread.delete('Ticket fechado por comando -ticketf.');
    } else {
      message.reply("Este comando só pode ser usado dentro de um ticket.");
    }
  } else if (message.content === "a") {
    message.reply("bcdefghijklmnopqrstuvwxyz")
  } else if (message.content === "ata") {
    message.reply("https://upload.wikimedia.org/wikipedia/pt/1/14/Ata_meme.jpg")
  } else if (message.content === "<@1271442133240516662> tá on?") {
    const randomMsg = Math.floor(Math.random() * 3);

    if(randomMsg === 0) {
      message.reply("😒 Claro que sim, pq não estaria? 😒")
    } else if (randomMsg === 1) {
      message.reply("Não, é claro que não... (Pera, então como que eu te respondi? AH ME PEGARAMMM)")
    } else if (randomMsg === 2) {
      message.reply("https://img-s-msn-com.akamaized.net/tenant/amp/entityid/BB1nX5Y7.img?w=600&h=451&m=6")
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName, options } = interaction;
    if (commandName === 'sorteio') {
      const title = options.getString('titulo');
      const description = options.getString('descricao') || 'Nenhuma descrição fornecida.';
      const duration = options.getInteger('duracao') * 60000;
      const winners = options.getInteger('vencedores');
      const imageUrl = options.getString('imagem') || null;

      const giveawayId = `giveaway-${interaction.id}`;
      const participants = new Set();

      giveaways[giveawayId] = {
        participants: Array.from(participants),
        winners,
        endTime: Date.now() + duration,
        channelId: interaction.channel.id,
        messageId: interaction.id,
      };
      saveGiveaways();

      const giveawayEmbed = new EmbedBuilder()
        .setTitle(`**${title}**`)
        .setDescription(description)
        .setColor(0x00FF00)
        .setFooter({ text: 'Participar clicando no botão abaixo!' });

      if (imageUrl) giveawayEmbed.setImage(imageUrl);

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
    }
  } else {
      const { user } = interaction;
      const threadName = `ticket-de-${user.username}`;

      const thread = await interaction.channel.threads.create({
        name: threadName,
        type: 12,
        reason: `Ticket criado por ${user.username}`,
      });

      await thread.members.add(user.id);

      await thread.send(`Ticket aberto! Quem abriu o ticket foi <@${user.id}>! Se você quiser fechar o ticket, mande "-ticketf"!\n-# <@&1275887072195903559> Respondam ele, galera...`,);

      await interaction.reply({ content: `Ticket aberto! Bora lá? <#${thread.id}>`, ephemeral: true})
     if (interaction.customId.endsWith('_participants')) {
      const [giveawayId, action] = interaction.customId.split('_');
      const giveaway = giveaways[giveawayId];
  
      if (!giveaway) return interaction.reply({ content: 'O sorteio já terminou.', ephemeral: true });
  
      const userId = interaction.user.id;
  
      if (action === 'participants') {
        const participantMentions = giveaway.participants.length
          ? giveaway.participants.map(p => `<@${p}>`).join('\n')
          : 'Nenhum participante ainda.';
  
        await interaction.reply({ content: `Participantes:\n${participantMentions}`, ephemeral: true });
      } else {
        if (giveaway.participants.includes(userId)) {
          giveaway.participants = giveaway.participants.filter(p => p !== userId);
          await interaction.reply({ content: 'Você saiu do sorteio.', ephemeral: true });
        } else {
          giveaway.participants.push(userId);
          await interaction.reply({ content: 'Você entrou no sorteio.', ephemeral: true });
        }
  
        // Update the participant count on the button
        const updatedParticipantsButton = new ButtonBuilder()
          .setCustomId(`${giveawayId}_participants`)
          .setLabel(`🧑Participantes (${giveaway.participants.length})`)
          .setStyle(ButtonStyle.Secondary);
  
        const updatedParticipateButton = new ButtonBuilder()
          .setCustomId(giveawayId)
          .setLabel('🎊 Participar')
          .setStyle(ButtonStyle.Primary);
  
        const row = new ActionRowBuilder().addComponents(updatedParticipateButton, updatedParticipantsButton);
        await interaction.message.edit({ components: [row] });
      }
  
      saveGiveaways();
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

const path = './giveaways.json';

let giveaways = JSON.parse(fs.readFileSync(path, 'utf8'));

function saveGiveaways() {
  fs.writeFileSync(path, JSON.stringify(giveaways));
}

client.login(token);