require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel]
});

// Set your guild, special role ID, and client ID
const GUILD_ID = '1269670073912524820';
const SPECIAL_ROLE_ID = '1271244040289124395';
const CLIENT_ID = '1271442133240516662';

// Giveaway storage
let giveaways = {};

// Command to start a giveaway
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'sorteio') {
        const nome = interaction.options.getString('nome');
        const descricao = interaction.options.getString('descricao');
        const duration = interaction.options.getInteger('duration');
        const numWinners = interaction.options.getInteger('winners');
        const image = interaction.options.getString('image') || null;
        const color = interaction.options.getString('color') || '00FF00'; // Default to lime green

        const endTime = new Date(Date.now() + duration * 60000);

        const embed = new EmbedBuilder()
            .setTitle(nome)
            .setDescription(descricao)
            .setColor(`#${color}`)  // Set the embed color or default
            .addFields(
                { name: '⏳ Termina em', value: `<t:${Math.floor(endTime / 1000)}:F>`, inline: false },
                { name: '🏆 Número de ganhadores', value: `${numWinners}`, inline: false },
                { name: '🚀 Impulsionadores', value: `<@&${SPECIAL_ROLE_ID}> tem 3 vezes mais chance de ganhar!\nImpulse o servidor para também ter esses benefícios!`, inline: false }
            );

        if (image) {
            embed.setImage(image);
        }

        const button = new ButtonBuilder()
            .setCustomId('join_giveaway')
            .setLabel('🎊 Participar')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        giveaways[message.id] = {
            nome,
            endTime,
            channelId: message.channelId,
            messageId: message.id,
            numWinners,
            participants: []
        };

        setTimeout(() => endGiveaway(message.id), duration * 60000);
    }
});

// Button interaction for joining the giveaway
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'join_giveaway') {
        const giveaway = giveaways[interaction.message.id];

        if (!giveaway.participants.includes(interaction.user.id)) {
            giveaway.participants.push(interaction.user.id);
            await interaction.reply({ content: 'You successfully joined the giveaway!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'You have already joined this giveaway!', ephemeral: true });
        }
    }
});

// Function to end a giveaway
async function endGiveaway(messageId) {
    const giveaway = giveaways[messageId];
    if (!giveaway) return;

    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);

    const guild = await client.guilds.fetch(GUILD_ID);
    const specialRole = await guild.roles.fetch(SPECIAL_ROLE_ID);

    let participants = giveaway.participants;

    // Give the special role members extra chance
    const finalParticipants = [];
    for (const id of participants) {
        const member = await guild.members.fetch(id);
        if (member.roles.cache.has(SPECIAL_ROLE_ID)) {
            finalParticipants.push(...Array(3).fill(member.user));
        } else {
            finalParticipants.push(member.user);
        }
    }

    if (finalParticipants.length > 0) {
        const winners = [];
        for (let i = 0; i < Math.min(giveaway.numWinners, finalParticipants.length); i++) {
            const winner = finalParticipants.splice(Math.floor(Math.random() * finalParticipants.length), 1)[0];
            winners.push(winner);
        }

        const winnerMentions = winners.map(user => `<@${user.id}>`).join(', ');
        await channel.send(`🎉 Parabéns ${winnerMentions}, você ganhou o sorteio **${giveaway.nome}**!`);
    } else {
        await channel.send('Ninguém participou do sorteio.');
    }

    delete giveaways[messageId];
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.token);