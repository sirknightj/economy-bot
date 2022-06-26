import { AutocompleteInteraction, Client, CommandInteraction, MessageEmbed } from "discord.js";
import { Bot } from "../../utils/Types";

module.exports = {
    name: "interactionCreate",

    execute: async (interaction: CommandInteraction, client: Bot) => {
        const command = client.commands.get(interaction.commandName);

        if (interaction.isCommand()) {
            if (!command) {
                interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor("RED")
                            .setDescription("⛔ An error occurred while running this command.")
                    ]});
                client.commands.delete(interaction.commandName);
            }
            
            command.execute(client, null, interaction);
        }

        if (interaction.isAutocomplete()) {
            command.handleAutocomplete(client, interaction);
        }        
    }
};
