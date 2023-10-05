require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const figlet = require('figlet');
const serverID = require('./config')
const discordToken = process.env.DISCORD_TOKEN;

const client = new Discord.Client({
    partials: ['CHANNEL', 'MESSAGE', "REACTION", 'GUILD_MEMBER'],
    intents: [513, Discord.Intents.FLAGS.GUILD_MEMBERS]
});
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

const rest = new REST({ version: '9' }).setToken(discordToken);

client.on('ready', async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, serverID),
            { body: commands },
        );

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }

    figlet('NakreS Development', function (err, data) {
        if (err) {
            console.log(err)
            return;
        }
        console.log(`\x1b[36m%s\x1b[0m`, data)// şekilli şukullu nick
        console.log('Haydi Bismillah')
    });
})

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            if (command.perms[0] && !command.perms.some(currPerm => interaction.member.permissions.has(currPerm) || interaction.member.roles.cache.some(role => role.id === currPerm))) return interaction.reply({ content: `You do not have permission to run this command!`, ephemeral: true })
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
})

client.on('guildMemberAdd', async (member) => {
    const roleID = '867748885333803019'; // verilecek rolün ID'si 
    const channelID = '867750174888951809'; //  log kanalının ID'si 
    const totalMembers = member.guild.memberCount; // Toplam üye sayısı

    try {
        const role = member.guild.roles.cache.get(roleID);
        await member.roles.add(role);
        const channel = member.guild.channels.cache.get(channelID);
        channel.send(`${member.toString()} **sunucuya katıldı ve rolü verildi. Güncel üye sayısı : ${totalMembers}**`);
    } catch (error) {
        console.error(error);
    }
});

client.login(discordToken)