import Discord from 'discord.js';
import { Bot, Command } from '../utils/Types';
import { promisify } from "node:util";
import { glob } from "glob";
import { ApplicationCommandPermissionTypes } from 'discord.js/typings/enums';
import config from '../config.json';
const PG = promisify(glob);
const Ascii = require("ascii-table");
let Commands: Array<any>;

const perms = Object.keys(Discord.Permissions.FLAGS);

/**
 * Load all of the command handlers.
 * @param {Bot} client the bot
 */
export default async (client: Bot): Promise<void> => {
    // Initialize a table of the events that we are loading.
    // Each table row contains the event name, and whether or not it was successfully loaded.
    const table = new Ascii("Commands Loaded");

    // Array holding all the slash commands
    Commands = [];

    // Grabs all of the file names
    const files: string[] = await PG(`./commands/**/*.ts`);

    // Load every command
    await Promise.all(files.map(async (file: string) => {
        let command: Command = require(`.${file}`).default;
        // Check if the file containing the handler is formatted correctly.

        // Check if the command is enabled. Skip if not.
        if (!command.enabled) {
            // console.log(command.enabled);
            console.log(command);
            return;
        }

        // Call the init function, if it exists.
        if (command.init) {
            if (typeof command.init !== 'function') {
                table.addRow(file, `❌ Init is not a function.`);
                return;
            }
            let errorMessage: string | void = await command.init();
            if (errorMessage) {
                table.addRow(file, `❌ Init failed with reason: ${errorMessage}`);
                return;
            }
        }

        // Check if the command has a name.
        if (!command.name) {
            table.addRow(file, `❌ Command name is missing.`);
            return;
        }

        // Check that the command has a description.
        if (!command.description) {
            table.addRow(file, `❌ Command description is missing.`);
            return;
        }

        // Check that the permissions are all correct.
        if (command.permissions) {
            // Handle the case where the permission is a single permission.
            if (typeof command.permissions === 'string') {
                if (!perms.includes(command.permissions)) {
                    table.addRow(file, `❌ Invalid permission: ${command.permissions}`);
                    return;
                }
            // Handle the case where permissions is an array of permissions.
            } else if (typeof command.permissions === 'object' && Array.isArray(command.permissions)) {
                command.permissions.forEach((permission: string) => {
                    if (!perms.includes(permission)) {
                        table.addRow(file, `❌ Invalid permission: ${permission}`);
                        return;
                    }
                });
            // If it's not a single permission, or an array of permissions, it's invalid.
            } else {
                table.addRow(file, `❌ Invalid permission(s): ${command.permissions}`);
                return;
            }
        }

        // If there are any aliases, add them to client.commands, but don't
        // add them to the Commands array
        if (command.aliases) {
            if (!Array.isArray(command.aliases)) {
                table.addRow(file, `❌ Invalid aliases array: ${command.aliases}`);
                return;
            }

            command.aliases.forEach((alias: string) => {
                client.commands.set(alias, command)
            });
        }

        client.commands.set(command.name, command);
        Commands.push(command);

        await table.addRow(command.name, "✔ SUCCESS");
    }));

    console.log(table.toString());

    client.on('ready', async () => {
        if (!config?.testServerID || config?.testServerID === '000000000000000000') {
            console.log("No test server configured.")
            return;
        }

        const testingGuild = await client.guilds.cache.get(config.testServerID);

        if (!testingGuild) { 
            console.log("Testing server failed to load.");
            return;
        }

        testingGuild.commands.set(Commands);
        console.log("Commands updated on the test server.");
    });
}