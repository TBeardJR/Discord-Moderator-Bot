import { CommandoClient } from "discord.js-commando";
import { TimeoutCommand } from "./commands/moderation/timeout";
import { createDiscordEventHandlers } from './discord/discord-events';
import { continueActiveTimeouts } from './command-helper/moderation/timeout/timeout';
import { timeoutDB } from './command-helper/moderation/timeout/timeout-db';
import { CancelTimeoutCommand, createOnCancelTimeoutObservable } from './commands/moderation/cancel-timeout';
import { isBotStillInGuild } from './discord/guild';
import { InfoCommand } from './commands/misc/info';
import { TimeoutStatsCommand } from './commands/moderation/timeout-stats';
import { onDBConnection$, testDBConnection } from './database/database'
import { CancelAllTimeoutsCommand } from './commands/moderation/cancel-all-timeouts';
import { CommandInfoCommand } from './commands/misc/commands';

export const client: CommandoClient = new CommandoClient({
    owner: process.env.DISCORD_BOT_OWNER,
    commandPrefix: '$',
    disableEveryone: true,
    unknownCommandResponse: false
});

client.registry
    .registerGroups([
        ['moderation', 'Moderation commands'],
        ['misc', 'miscellaneous commands']
    ])
    .registerDefaultGroups()
    .registerDefaultTypes()
    .registerCommands([TimeoutCommand, CancelTimeoutCommand, TimeoutStatsCommand, CancelAllTimeoutsCommand, InfoCommand, CommandInfoCommand])

testDBConnection();
   
onDBConnection$.subscribe({
    next: () => {
        console.log("Successfully connected to database!!");
        client.login(process.env.DISCORD_TOKEN).then(() => {
            console.log('Client has successfully logged in!');
            createDiscordEventHandlers();
            continueActiveTimeouts(timeoutDB, client.user.id, createOnCancelTimeoutObservable, isBotStillInGuild);
        });
    },
    error: (error) => {
        console.error(`Could not connect to database: ${error} \nKilling process...`);
        process.kill(1);
    }
});



