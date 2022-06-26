import { Client, CommandInteraction, GuildMember, Message, MessageEmbed, ApplicationCommandOptionChoiceData, AutocompleteInteraction, AutocompleteFocusedOption } from "discord.js";
import { UnsupportedCommandEmbed } from "../../utils/Replies";
import fetch from 'cross-fetch';
import { Bot } from "../../utils/Types";
import stringSimilarity from "string-similarity";
const Discord = require("discord.js");
const config = require("../../config");

const allProducts: ApplicationCommandOptionChoiceData[] = [];

module.exports = {
    name: "bazaar",
    aliases: ["bz"],
    description: "Reports back on the bazaar items.",
    options: [
        {
            name: 'item',
            description: 'The name of the bazaar product.',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
            autocomplete: true
        }
    ],
    enabled: config.hypixelApiKey.length !== "YOUR HYPIXEL API KEY HERE",
    choices: allProducts,
    permissions: "ADMINISTRATOR",

    init: async () => {
        if (!config.hypixelApiKey) {
            return;
        }
    
        allProducts.length = 0;
    
        try {
            let resp: Response = await fetch(`https://api.hypixel.net/skyblock/bazaar?key=${config.hypixelApiKey}`);
            if (!resp.ok) {
                throw resp;
            }
    
            let data: any = await resp.json();
    
            for (const key in data.products) {
                allProducts.push({
                    name: data.products[key].product_id.replaceAll("_", " ").toLowerCase(),
                    value: data.products[key].product_id
                });
            }

            // Sort options alphabetically
            allProducts.sort((a: ApplicationCommandOptionChoiceData, b: ApplicationCommandOptionChoiceData): number => {
                return a.name.localeCompare(b.name);
            });
        
        } catch (e) {
            console.log(e);
        }
    },

    async execute(bot: Client, message: Message, interaction: CommandInteraction) {
        if (message) {
            message.reply({ embeds: [ UnsupportedCommandEmbed ] });
        }
        
        if (interaction) {
            const member: GuildMember | undefined = await interaction.guild?.members.fetch(interaction.user.id);

            if (!member) throw 'API error';

            let embed : MessageEmbed = await this.fetchBazaarEmbed(interaction.options.get('item')?.value);

            interaction.reply({ embeds: [ embed ] });
        }
    },

    handleAutocomplete: (client: Bot, interaction: AutocompleteInteraction) => {
        const focusedOption = interaction.options.getFocused(true);
        let choices: ApplicationCommandOptionChoiceData[];
        if (focusedOption.name === 'item') {
            choices = allProducts;
        } else {
            choices = [];
        }

        const filtered = choices.filter((choice: ApplicationCommandOptionChoiceData) => choice.name.startsWith(focusedOption.value));
        interaction.respond(filtered.slice(0, 25));
    },

    async fetchBazaarEmbed(id: string): Promise<MessageEmbed> {
        try {
            let response: Response = await fetch(`https://api.hypixel.net/skyblock/bazaar?key=${config.API_KEY}`);
            if (!response.ok) {
                return new Discord.MessageEmbed()
                    .setColor("RED")
                    .setTitle(`Error code ${response.status}`)
                    .setDescription(`There was an error running this command: ${response.statusText}`);
            }
            let data: any = await response.json();

            if (data.products[id]) {
                return new Discord.MessageEmbed()
                    .setColor("GOLD")
                    .setTitle(id)
                    .setDescription(`Last updated: <t:${Math.round(data.lastUpdated / 1000)}:F>`)
                    // @ts-ignore
                    .addFields(this.getProductEmbedFields(data, id));
            } else {
                let attemptedProductName = stringSimilarity.findBestMatch(id, allProducts.map(opt => "" + opt.value)).bestMatch.target;
                return new Discord.MessageEmbed()
                    .setColor("GOLD")
                    .setTitle(attemptedProductName)
                    .setDescription([`There is no product with the name ${id}.`,
                        `The closest match is: ${attemptedProductName}`,
                        `Last updated: <t:${Math.round(data.lastUpdated / 1000)}:F>`].join("\n"))
                    // @ts-ignore
                    .addFields(this.getProductEmbedFields(data, attemptedProductName));
            }
        } catch (e) {
            console.log(e);
            return new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("There was an error running this command!");
        }
    },

    getProductEmbedFields(data: any, productName: string) {
        return [
            { name: "Instant Sell", value: `${data.products[productName].quick_status.sellPrice}`, inline: true },
            { name: "Sell Volume", value: `${(data.products[productName].quick_status.sellVolume)}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: "Instant Buy", value: `${data.products[productName].quick_status.buyPrice}`, inline: true },
            { name: "Buy Volume", value: `${(data.products[productName].quick_status.buyVolume)}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: "Buy Orders", value: `${this.summaryToString(data.products[productName].sell_summary, false).join('\n')}`, inline: true },
            { name: "Sell Orders", value: `${this.summaryToString(data.products[productName].buy_summary, false).join('\n')}`, inline: true }
        ];
    },
    
    summaryToString(summary: any[], ascending: boolean) {
        if (summary.length === 0) {
            return 'None!';
        } else {
            let result = [];
            let i = 0;
            while (summary.length !== 0 && i < 15) {
                let thisSummary = ascending ? summary.pop() : summary.shift();
                if (!thisSummary) throw 'Error!';
                result.push(`${(thisSummary.amount)} @ ${(thisSummary.pricePerUnit)} (${(thisSummary.orders)} order${thisSummary.orders === 1 ? '' : 's'})`);
                i++;
            }
            return result;
        }
    }
};
