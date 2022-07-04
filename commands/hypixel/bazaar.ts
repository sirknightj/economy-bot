import { Client, CommandInteraction, GuildMember, Message, MessageEmbed, ApplicationCommandOptionChoiceData, AutocompleteInteraction, EmbedFieldData } from "discord.js";
import { UnsupportedCommandEmbed } from "../../utils/Replies";
import fetch from 'cross-fetch';
import { Bot, Command, BazaarData, BuySellSummary } from "../../utils/Types";
import levenshtein from "fast-levenshtein";
import { parseArgs } from "../../utils/Parsers";
const Discord = require("discord.js");
const config = require("../../config");

// Array holding all of the bazaar options to choose from
// Each option object has 2 properties:
//   name - the display name of the option (lowercase with spaces)
//   value - the hypixel item ID of that option (UPPER_SNAKE_CASE)
const allProducts: ApplicationCommandOptionChoiceData[] = [];

interface BazaarCommand extends Command {
    fetchBazaarEmbed: (id: string) => Promise<MessageEmbed>;
    summaryToString: (summary: any[], ascending: boolean) => string;
    getProductEmbedFields: (data: any, productName: string) => EmbedFieldData[];
}

enum Options {
    ITEM = "item",
    SECRET = "hidden",
}

export default {
    name: "bazaar",
    aliases: ["bz"],
    description: "Reports back on the bazaar items.",
    options: [
        {
            name: Options.ITEM,
            description: 'The name of the bazaar product.',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
            autocomplete: true
        },
        {
            name: Options.SECRET,
            description: '\"Only you can see this message.\" Default: False',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.BOOLEAN
        }
    ],
    enabled: config.hypixelApiKey !== "YOUR HYPIXEL API KEY HERE",
    choices: allProducts,

    /**
     * To initialize this command, fetch the bazaar items from the Hypixel Skyblock API.
     * We then store the bazaar items, so that we can return the options for the autocomplete.
     */
    init: async (): Promise<string | void> => {
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
                let product: ApplicationCommandOptionChoiceData = {
                    // e.g. "absolute ender pearl"
                    name: data.products[key].product_id.replaceAll("_", " ").toLowerCase(),
                    // e.g. "ABSOLUTE_ENDER_PEARL"
                    value: data.products[key].product_id
                };
                allProducts.push(product);
            }

            // Sort options alphabetically
            allProducts.sort((a: ApplicationCommandOptionChoiceData, b: ApplicationCommandOptionChoiceData): number => {
                return a.name.localeCompare(b.name);
            });
        } catch (e) {
            console.log(e);
        }
    },

    async execute(bot: Client, message: Message, interaction: CommandInteraction): Promise<void> {
        if (message) {
            let embed: MessageEmbed = await this.fetchBazaarEmbed(parseArgs("pp ", message.content).join("_").toUpperCase());
            message.reply({ embeds: [ embed ] });
        }
        
        if (interaction) {
            let embed: MessageEmbed = await this.fetchBazaarEmbed(("" + interaction.options.get(Options.ITEM)?.value).replaceAll(" ", "_").toUpperCase());

            let hidden: boolean = interaction.options.get(Options.SECRET)?.value as boolean;

            interaction.reply({ embeds: [ embed ], ephemeral: hidden });
        }
    },

    handleAutocomplete: async (client: Bot, interaction: AutocompleteInteraction): Promise<void> => {
        const focusedOption = interaction.options.getFocused(true);
        let choices: ApplicationCommandOptionChoiceData[];
        if (focusedOption.name === Options.ITEM) {
            choices = allProducts;
        } else {
            choices = [];
        }

        const filtered = choices.filter((choice: ApplicationCommandOptionChoiceData) => choice.name.startsWith(focusedOption.value));
        interaction.respond(filtered.slice(0, 25)); // only first 25 shown because of Discord's limit
    },

    /**
     * Looks up an item from Hypixel's bazaar and returns information for that item
     * @param id Hypixel's item id of the item to look up. Examples would be "ABSOLUTE_ENDER_PEARL" or "BOOSTER_COOKIE"
     * @returns An embed with bazaar statistics
     */
    async fetchBazaarEmbed(id: string): Promise<MessageEmbed> {
        if (!id) {
            return new Discord.MessageEmbed()
                .setColor("RED")
                .setTitle(`Missing arguments!`)
                .setDescription(`What bazaar product am I supposed to look up?`);
        }
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
                // If the product with the exact ID exists, then return the embed with that data.
                return new Discord.MessageEmbed()
                    .setColor("GOLD")
                    .setTitle(id)
                    .setDescription(`Last updated: <t:${Math.round(data.lastUpdated / 1000)}:F>`)
                    .addFields(this.getProductEmbedFields(data, id));
            } else {
                // If the user inputted an ID that doesn't exist, then return the closest match if it exists

                // Find the closest match. By 'closest', we use the 'Levenshtein distance' and look for
                // the one with the smallest distance (closest) to the in the user passed in.
                let minDist = Infinity; // the Levenshtein distance of the bestMatchSoFar
                let bestMatch: string = allProducts.reduce((bestMatchSoFar: string, current: ApplicationCommandOptionChoiceData): string => {
                    // Calculate the Levenshtein distance
                    let distance: number = levenshtein.get(id, "" + current.value);

                    if (distance < minDist) {
                        // current is a better match than bestMatchSoFar, so we update minDist
                        // to hold the new best Levenshtein distance.
                        minDist = distance;
                        return "" + current.value;
                    } else { // distance >= minDist
                        // bestMatchSoFar is a better match than current.
                        return bestMatchSoFar;
                    }
                }, "");

                // We know that allProducts is non-empty. Thus, it is impossible that minDist is still Infinity.

                if (minDist < id.length) {
                    // We consider a distane less than id.length to be "close enough" to be a reasonable-enough autocorrect.
                    // We don't want items like "B" to be autocorrected to "BONE"
                    return new Discord.MessageEmbed()
                        .setColor("GOLD")
                        .setTitle(bestMatch)
                        .setDescription([`There is no product with the name ${id}.`,
                            `The closest match is: ${bestMatch}`,
                            `Last updated: <t:${Math.round(data.lastUpdated / 1000)}:F>`].join("\n"))
                        .addFields(this.getProductEmbedFields(data, bestMatch));
                } else {
                    // Anything further we consider too far away to be accurate
                    // So, what we do is list out all of the products that start with the same
                    // letter as what the user passed in.
                    let charIdStartsWith: string = id.charAt(0); // We are guaranteed that id.length > 0.
                    let productsThatStartSimilarly: string = allProducts.reduce((soFar: string, current: ApplicationCommandOptionChoiceData): string => {
                        if (current.name.startsWith(charIdStartsWith)) {
                            // Check if soFar has names in it yet. If so, then add new names
                            // seperated by a ", ". If current is the first name we're adding to
                            // soFar, then we just return current.name.
                            if (soFar) {
                                return soFar += ", " + current.name;
                            } else {
                                return current.name;
                            }
                        }
                        // current doesn't start with the same character as id, therefore,
                        // soFar doesn't get updated
                        return soFar;
                    }, "")
                    return new Discord.MessageEmbed()
                        .setColor("RED")
                        .setTitle(id)
                        .setDescription(`There is no product with the name \`${id}\`.`)
                        .addFields([{
                            name: `Bazaar products that start with ${id.charAt(0)}:`,
                            value: `${productsThatStartSimilarly || "none"}`
                        }]);
                }
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
    getProductEmbedFields(data: BazaarData, productName: string): EmbedFieldData[] {
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
