import { MessageEmbed } from "discord.js";

export let UnsupportedCommandEmbed = new MessageEmbed()
    .setColor("RED")
    .setDescription("This command must be used as a slash command!");