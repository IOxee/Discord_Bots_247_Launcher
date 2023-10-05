require('dotenv').config();
const Discord = require('discord.js');
const { footer, customerrole, logChanel, embedColour } = require('../config')
const { default: axios } = require('axios');
const { SlashCommandBuilder } = require('@discordjs/builders');
const tebexSecret = process.env.TEBEX_SECRET

module.exports = {
    perms: [],
    data: new SlashCommandBuilder()
        .setName('customer')
        .setDescription('Your Transaction ID')
        .addStringOption(option => option.setName('id').setDescription('The payment / checkout ID').setRequired(true)),
    async execute(interaction) {

        const res = await axios.get(`https://plugin.tebex.io/payments/${interaction.options.get('id').value}`, {
            method: 'GET',
            headers: { 'X-Tebex-Secret': tebexSecret },
        }).catch(err => {
            return interaction.reply({ content: 'No purchase found with that  Transaction ID!', ephemeral: true })
        })
        if (!res) return;
        const data = await res.data;
        if (data.status !== 'Complete') return interaction.reply({ content: `Purchase is currently marked as ${data.status}`, ephemeral: true })
        if (data.amount <= 0) return interaction.reply({ content: `You cannot take a customer role for free scripts`, ephemeral: true })

        let category = interaction.guild.channels.cache.find(cat => cat.name === 'CUSTOMER-TICKETS' && cat.type === 'GUILD_CATEGORY');
        if (!category) {
            category = await interaction.guild.channels.create('CUSTOMER-TICKETS', {
                type: 'GUILD_CATEGORY'
            });
        }

        const chanelName = `ticket-${interaction.user.username}-${interaction.user.discriminator}`
        const existingChannel = await interaction.guild.channels.fetch()
            .then(channels => channels.find(channel =>
                channel.name === chanelName.toLowerCase()
            ));

        var channel = existingChannel
        if (!existingChannel) {
            channel = await interaction.guild.channels.create(chanelName, {
                type: 'text',
                parent: category, // Ticket kanallarının oluşturulacağı kategori
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: ['VIEW_CHANNEL'] // kanalı göstermeyi engelle
                    },
                    {
                        id: interaction.user.id, // Kullanıcıya
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] // kanalı görüntüleme ve mesaj gönderme izni ver
                    },

                ]
            });
        }

        const chanelEmbed = new Discord.MessageEmbed()
            .setColor(0x00FF00)
            .setAuthor(`Your support room is ready`)
            .setThumbnail(interaction.guild.iconURL())
            .addField("Hi", `<@${interaction.user.id}>`,)
            .addField("Open Ticket", `You can request support through this channel`)
            .setFooter(`${footer} - Made By NakreS`, interaction.guild.iconURL());
        channel.send({ embeds: [chanelEmbed] })

        const packages = data.packages.map(package => package.name)
        const embed = new Discord.MessageEmbed()
            .setColor(embedColour)
            .setAuthor(`Purchasing information`)
            .setThumbnail(interaction.guild.iconURL())
            .addField('User', `<@${interaction.user.id}>`)
            .addField(`Customer Name`, data.player.name)
            .addField(`Email`, data.email)
            .addField(`Purchased`, packages.join(', '))
            .addField(`Price Payed`, `${data.amount} ${data.currency.iso_4217}`)
            .addField(`Date Purchased`, data.date.slice(0, 10))
            .addField(`Your ticket channel`, `${channel.toString()}`)
            .setFooter(`${footer} - Made By NakreS`, interaction.guild.iconURL());

        const customerRole = interaction.guild.roles.cache.find(role => role.name === customerrole);
        interaction.member.roles.add(customerRole);

        const logChannel = interaction.guild.channels.cache.find(channel => channel.name === logChanel);
        logChannel.send({ embeds: [embed] });

        interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
