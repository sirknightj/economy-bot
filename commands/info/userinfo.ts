import { Client, CommandInteraction, GuildMember, Message, MessageEmbed, CommandInteractionOption, CacheType, EmbedAuthorData } from "discord.js";
import { UnsupportedCommandEmbed } from "../../utils/Replies";
import { Command } from "../../utils/Types";
const Discord = require("discord.js");

enum Options {
    TARGET = "target",
    SECRET = "hidden",
}

export default {
    name: "userinfo",
    description: "Tells you useful information about a user.",
    permissions: "ADMINISTRATOR",
    options: [
        {
            name: Options.TARGET,
            description: 'The user you want information for.',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: Options.SECRET,
            description: '\"Only you can see this message.\" Default: False',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN
        },
    ],
    enabled: true,

    execute: async (bot: Client, message: Message, interaction: CommandInteraction) => {
        if (message) {
            message.reply({
                embeds: [ UnsupportedCommandEmbed ]
            });
        }
        
        if (interaction) {
            if (!interaction.guild) {
                throw 'This command is only available in a Discord server!';
            }

            let option: CommandInteractionOption<CacheType> | null = interaction.options.get(Options.TARGET);

            if (!option) {
                throw 'Must specify a valid target!';
            }

            // @ts-ignore
            let target: GuildMember = option.member;

            // @ts-ignore
            let author: EmbedAuthorData = { name: target.user.tag, iconURL: target.user.avatarURL({ dynamic: true, size: 2048 }) };

            interaction.reply({
                embeds: [ new MessageEmbed()
                    .setColor(target.premiumSinceTimestamp ? "LUMINOUS_VIVID_PINK" : "BLURPLE")
                    // @ts-ignore
                    .setAuthor(author)
                    // @ts-ignore
                    .setThumbnail(target.user.avatarURL({ dynamic: true, size: 2048 }))
                    .addField("ID", target.id)
                    .addField("Roles", target.roles.cache.map(r => r).sort((r1, r2) => r2.comparePositionTo(r1)).join(" ").replace("@everyone", " ").slice(0, 1023) || "None")
                    .addField("Member Since", `<t:${Math.round((target.joinedTimestamp || 0) / 1000)}:R>`, true)
                    .addField("Discord User Since", `<t:${Math.round((target.user.createdTimestamp || 0) / 1000)}:R>`, true)
                    .addField("Boosted This Server Since", `${target.premiumSinceTimestamp ? `<t:${Math.round((target.premiumSinceTimestamp) / 1000)}:R>` : "Not currently boosting."}`, true)
                ],
                ephemeral: interaction.options.get(Options.SECRET)?.value as boolean,
            });
        }
    }
} as Command;
