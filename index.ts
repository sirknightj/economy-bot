import Discord, { Collection, Message } from 'discord.js';
import { Bot } from './utils/Types';
const CONFIG = require('./config.json');

// @ts-ignore
const client: Bot = new Discord.Client({
    intents: 32767, // all of them
});

client.commands = new Collection();

require("./handlers/events")(client);
require("./handlers/commands")(client);

client.login(CONFIG.token);