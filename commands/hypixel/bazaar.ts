import { Client, CommandInteraction, GuildMember, Message, MessageEmbed, ApplicationCommandOptionChoiceData, AutocompleteInteraction, EmbedFieldData } from "discord.js";
import { UnsupportedCommandEmbed } from "../../utils/Replies";
import fetch from 'cross-fetch';
import { Bot, Command, BazaarData, BuySellSummary } from "../../utils/Types";
import stringSimilarity from "string-similarity";
const Discord = require("discord.js");
const config = require("../../config");

// Array holding all of the bazaar options to choose from
const allProducts: ApplicationCommandOptionChoiceData[] = [];

interface BazaarCommand extends Command {
    fetchBazaarEmbed: (id: string) => Promise<MessageEmbed>;
    summaryToString: (summary: any[], ascending: boolean) => string;
    getProductEmbedFields: (data: any, productName: string) => EmbedFieldData[];
}

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
    enabled: config.hypixelApiKey !== "YOUR HYPIXEL API KEY HERE",
    choices: allProducts,

    init: async () => {
        if (!config.hypixelApiKey) {
            return;
        }
    
        allProducts.length = 0; // empty the array
    
        try {
            let resp: Response = await fetch(`https://api.hypixel.net/skyblock/bazaar?key=${config.hypixelApiKey}`);
            if (!resp.ok) {
                throw resp;
            }
    
            let data: BazaarData = await resp.json() as BazaarData;
    
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

            let embed : MessageEmbed = await this.fetchBazaarEmbed("" + interaction.options.get('item')?.value);

            interaction.reply({ embeds: [ embed ] });
        }
    },

    handleAutocomplete: async (client: Bot, interaction: AutocompleteInteraction) => {
        const focusedOption = interaction.options.getFocused(true);
        let choices: ApplicationCommandOptionChoiceData[];
        if (focusedOption.name === 'item') {
            choices = allProducts;
        } else {
            choices = [];
        }

        const filtered = choices.filter((choice: ApplicationCommandOptionChoiceData) => choice.name.startsWith(focusedOption.value));
        interaction.respond(filtered.slice(0, 25)); // only first 25 shown because of Discord's limit
    },

    /**
     * Looks up an item from Hypixel's bazaar and returns information for that item
     * @param id Hypixel's item id of the item to look up
     * @returns An embed with bazaar statistics
     */
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
                    .addFields(this.getProductEmbedFields(data, id));
            } else {
                let attemptedProductName = stringSimilarity.findBestMatch(id, allProducts.map(opt => "" + opt.value)).bestMatch.target;
                return new Discord.MessageEmbed()
                    .setColor("GOLD")
                    .setTitle(attemptedProductName)
                    .setDescription([`There is no product with the name ${id}.`,
                        `The closest match is: ${attemptedProductName}`,
                        `Last updated: <t:${Math.round(data.lastUpdated / 1000)}:F>`].join("\n"))
                    .addFields(this.getProductEmbedFields(data, attemptedProductName));
            }
        } catch (e) {
            console.log(e);
            return new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("There was an error running this command!");
        }
    },

    /**
     * Gets and formats the embed fields for a certain bazaar product
     * @param data Hypixel Bazaar Data
     * @param productName the name of the product 
     * @returns the fields of a MessageEmbed for this product
     */
    getProductEmbedFields(data: BazaarData, productName: string) {
        return [
            { name: "Instant Sell", value: `${data.products[productName].quick_status.sellPrice}`, inline: true },
            { name: "Sell Volume", value: `${(data.products[productName].quick_status.sellVolume)}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true }, // embed linebreak
            { name: "Instant Buy", value: `${data.products[productName].quick_status.buyPrice}`, inline: true },
            { name: "Buy Volume", value: `${(data.products[productName].quick_status.buyVolume)}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true }, // embed linebreak
            { name: "Buy Orders", value: `${this.summaryToString(data.products[productName].sell_summary, false)}`, inline: true },
            { name: "Sell Orders", value: `${this.summaryToString(data.products[productName].buy_summary, false)}`, inline: true }
        ];
    },
    
    /**
     * Returns a string of the top 15 order data
     * e.g. "5 @ 1,000,000 (2 orders)" to represent that there is an order
     * for 5 of that item, for 1 million coins each, across 2 different orders
     * @param summary The bazaar summaries from Hypixel's data
     * @param ascending true if the summary should be in ascending order
     * @returns a string representing the first 15 order entries
     */
    summaryToString(summary: BuySellSummary[], ascending: boolean): string {
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
            return result.join("\n");
        }
    }
} as BazaarCommand;
