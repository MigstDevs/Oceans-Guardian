const { SlashCommandBuilder, MessageActionRow, MessageButton, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('Reroll a giveaway')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID of the message with the giveaway')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user has the necessary permissions
        if (!interaction.member.permissions.has('MANAGE_GUILD')) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const messageId = interaction.options.getString('message_id');

        try {
            // Fetch the giveaway message
            const message = await interaction.channel.messages.fetch(messageId);

            // Check if the message contains a giveaway embed
            const embed = message.embeds[0];
            if (!embed || !embed.title || !embed.description) {
                return interaction.reply({ content: 'No giveaway found in the provided message ID.', ephemeral: true });
            }

            // Assuming you have a way to get the list of participants from your storage
            // For this example, we'll simulate with a random selection
            // You should replace this with your actual method for selecting winners
            const participants = []; // Get participants from your storage
            const numberOfWinners = 1; // Adjust this if you want to choose more winners

            if (participants.length === 0) {
                return interaction.reply({ content: 'No participants found for this giveaway.', ephemeral: true });
            }

            const winners = [];
            for (let i = 0; i < numberOfWinners; i++) {
                const winner = participants[Math.floor(Math.random() * participants.length)];
                winners.push(winner);
                participants.splice(participants.indexOf(winner), 1); // Remove winner from participants list
            }

            // Create a new embed with winners
            const winnerEmbed = new EmbedBuilder()
                .setTitle('Giveaway Winners!')
                .setDescription(`Congratulations to ${winners.join(', ')}!`)
                .setColor('00FF00');

            // Reply to the interaction with winners
            await interaction.reply({ content: 'Giveaway rerolled!', ephemeral: true });
            await interaction.followUp({ embeds: [winnerEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};