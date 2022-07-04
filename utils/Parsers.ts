/**
 * Parses the user's input, and the arguments in array form, not including
 * the command name.
 * e.g.
 * prefix = "!" and contents = "!ping true", then we return ["true"]
 * 
 * @param prefix The prefix the command should start with.
 * @param contents The user's raw input. Should start with the prefix.
 * @returns the user's input in array form. Each argument is an element
 *          in the array. The prefix and command name are included in the
 *          array. We assume all command names are 1-word long.
 */
export const parseArgs = (prefix: string, contents: string): string[] => {
    if (!contents.startsWith(prefix)) {
        return [];
    }

    let args: string[] = contents.trim().slice(prefix.length).split(/ +/);
    args.shift(); // throw away the command name

    return args;
}