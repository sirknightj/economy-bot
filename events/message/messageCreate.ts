import { Client, Message, MessageEmbed } from "discord.js";
import { Bot } from "../../utils/Types";
const Discord = require("discord.js");

module.exports = {
    name: "messageCreate",

    execute: async (message: Message, client: Bot) => {
        const prefix = "pp ";
        if (!message.content.startsWith(prefix)) {
            return;
        }

        const commandName: string = message.content.slice(prefix.length).split(" ")[0];
        // @ts-ignore
        const command = client.commands.get(commandName);

        if (!command) {
            if (!message?.guild?.me?.permissionsIn(message.channel.id).has("SEND_MESSAGES")) {
                console.log(`⛔ I cannot send messages in ${message.channel.id}!`);
                return;
            }
           
            return message.channel.send({
                embeds: [new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription(`⛔ Invalid command name: \`${commandName}\``)]
            });
        }
        
        command.execute(client, message, null);
    }
};
