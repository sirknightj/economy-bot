import Discord from 'discord.js';
import { Bot } from '../../utils/Types';

module.exports = {
    name: "ready",
    once: "true",

    execute: async (client: Bot) => {
        console.log("The bot is up and ready to go.");
    }
};