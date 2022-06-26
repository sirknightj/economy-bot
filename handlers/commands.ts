import Discord, { ApplicationCommandDataResolvable, Util } from 'discord.js';
import { Bot } from '../utils/Types';
const perms = Object.keys(Discord.Permissions.FLAGS);
const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const Ascii = require("ascii-table");
let Commands: Array<any>;

/**
 * Load all of the command handlers.
 * @param {Bot} client the bot
 */
 module.exports = async (client: Bot) => {
    // Initialize a table of the events that we are loading.
    // Each table row contains the event name, and whether or not it was successfully loaded.
    const table = new Ascii("Commands Loaded");

    // Array holding all the slash commands
    Commands = [];

    // Grabs all of the file names
    const files: string[] = await PG(`./commands/**/*.ts`);

    // Load every command
    await Promise.all(files.map(async (file: string) => {
        let command = require(`.${file}`);
        // Check if the file containing the handler is formatted correctly.

        if (command.init) {
            if (typeof command.init !== 'function') {
                table.addRow(file, `❌ Init is not a function.`);
                return;
            }
            await command.init();
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
        const testingGuild = await client.guilds.cache.get("686282091058561138");
        if (!testingGuild) return;

        // @ts-ignore
        testingGuild.commands.set(Commands).then(async (command) => {
            const Roles = (commandName: string) => {
                const cmdPerms = Commands.find((c) => c.name === commandName).permission;
                if (!cmdPerms) return null;
                // @ts-ignore
                return testingGuild.roles.cache.filter((r) => r.permissions.has(cmdPerms));
            }

            // @ts-ignore
            const fullPermissions = command.reduce((accumulator, r) => {
                const roles = Roles(r.name);
                if (!roles) return accumulator;

                // @ts-ignore
                const permissions = roles.reduce((a, r) => {
                    return [...a, { id: r.id, type: "ROLE", permission: true }];
                }, []);

                // @ts-ignore
                return [...accumulator, { id: r.id, permissions }]
            }, []);

            if (!fullPermissions.length) return;
            console.log("We have made it here");
            // @ts-ignore
            await testingGuild.commands.permissions.set({ fullPermissions });
        });
    });
}