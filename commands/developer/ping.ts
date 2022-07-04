import { Client, CommandInteraction, Message } from "discord.js";
import { Command } from "../../utils/Types";

export default {
    name: "ping",
    description: "Replies with pong.",
    permissions: "ADMINISTRATOR",
    enabled: true,

    execute: async (bot: Client, message: Message, interaction: CommandInteraction) => {
        if (message) {
            message.reply("pong");
        }
        
        if (interaction) {
            interaction.reply({
                content: "pong",
                ephemeral: false
            });
        }
    }
} as Command;
