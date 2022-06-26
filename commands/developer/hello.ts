import { Client, CommandInteraction, GuildMember, Message, MessageEmbed } from "discord.js";
import { UnsupportedCommandEmbed } from "../../utils/Replies";
import { Command } from "../../utils/Types";

module.exports = {
    name: "hello",
    description: "Says hello.",
    permissions: "ADMINISTRATOR",

    execute: async (bot: Client, message: Message, interaction: CommandInteraction) => {
        if (message) {
            message.reply({ embeds: [UnsupportedCommandEmbed] });
        }
        
        if (interaction) {
            const member: GuildMember | undefined = await interaction.guild?.members.fetch(interaction.user.id);

            if (!member) throw 'API error';

            interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor("GREEN")
                        .setDescription(`Hello ${member.displayName}!`)
                ]});
        }
    }
} as Command;
