import Discord, { Collection, Message } from 'discord.js';
import { Bot } from './utils/Types';
const CONFIG = require('./config.json');

// @ts-ignore
const client: Bot = new Discord.Client({
    intents: 32767, // all of them
});

client.commands = new Collection();

import eventHandler from "./handlers/events";
eventHandler(client);
import commandHandler from "./handlers/commands";
commandHandler(client);

client.login(CONFIG.token);