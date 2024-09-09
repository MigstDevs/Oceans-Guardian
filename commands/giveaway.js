const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create a giveaway')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title of the giveaway')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description of the giveaway')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the giveaway in minutes')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Number of winners')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('URL of the image to include in the embed (optional)'))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Hex color code for the embed (optional)')
                .setDefault('00FF00')), // Default to lime green
    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const duration = interaction.options.getString('duration');
        const winners = interaction.options.getInteger('winners');
        const image = interaction.options.getString('image');
        const color = interaction.options.getString('color') || '00FF00'; // Default color

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: `Ends in ${duration} minutes` });

        if (image) {
            embed.setImage(image);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('joinGiveaway')
                    .setLabel('🎊 Participar')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ content: 'Giveaway created!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};