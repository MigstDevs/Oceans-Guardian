import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from 'dotenv';
import { setTimeout } from 'node:timers/promises';

config(); // Load environment variables

const token = process.env.token;
const clientId = process.env.clientId;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
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
        name: 'descricao',
        description: 'Descrição do sorteio',
        type: 3, // STRING
        required: false,
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
        name: 'imagem',
        description: 'URL da imagem para o sorteio',
        type: 3, // STRING
        required: false,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Atualizando comandos de barra...');
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Comandos de barra atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar comandos de barra:', error);
  }
})();

client.on('ready', () => {
  console.log(`O bot está online como ${client.user.tag}`);
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