import Discord from 'discord.js';
import { Bot } from '../utils/Types';
const { events } = require("../utils/EventNames");
const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const Ascii = require("ascii-table");

/**
 * Load all of the event handlers.
 * @param {Bot} client the bot that's listening to the events
 */
module.exports = async (client: Bot) => {
    // Initialize a table of the events that we are loading.
    // Each table row contains the event name, and whether or not it was successfully loaded.
    const table = new Ascii("Events Loaded");

    const files: string[] = await PG(`./events/**/*.ts`);
    files.map(async (file: string) => {
        const event = require(`.${file}`);

        // Check if the file containing the handler is formatted correctly.
        if (!events.includes(event.name) || !event.name) {
            table.addRow(`${event.name || "MISSING"}`, `❌ Event name is either invalid or missing: ${file}`);
            return;
        }

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }

        await table.addRow(event.name, "✔ SUCCESS");
    });

    console.log(table.toString());
}