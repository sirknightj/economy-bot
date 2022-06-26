import { Client, CommandInteraction, Message } from "discord.js";

module.exports = {
    name: "ping",
    description: "Replies with pong.",
    permissions: "ADMINISTRATOR",

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
};
