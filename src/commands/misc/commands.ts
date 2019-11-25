import { Command, CommandoClient, CommandMessage } from "discord.js-commando";
import { MessageOptions } from "discord.js";
import { stripIndent } from "common-tags";

export class CommandInfoCommand extends Command {
     
	constructor(client: CommandoClient) {
		super(client, {
			name: 'commands',
            group: 'misc',
            aliases: ['cs'],
			memberName: 'commands',
			description: 'command info',
			details: `command info`,
			examples: ['$command']
		});
	}

	async run(message: CommandMessage) {
        return message.say(stripIndent`
            \`\`\`md
            #### COMMANDS ####

            # Timeout Member    

            Description: Times a member out for a specified amount of time. 
            Command: $timeout [TAG MEMBER] [DURATION]
            Example: $timeout @ClownUser 3d 7h 42m 3s
            Aliases: $t, $to, $mute
            Notes: Max timeout is 7 days. Attempting to set timeouts longer will either be ignored or defaulted to 7 days. Shortest timeout is 15 seconds.

            # Cancel Timeout  
            
            Description: Cancel's timeout for specifed member. 
            Command: $cancel-timeout [TAG MEMBER]
            Example: $cancel-timeout @ClownUser
            Aliases: $ct, $cto, $unmute
            Notes: N/A

            # Cancel All Timeouts  
            
            Description: Cancel's all timeouts in the server.
            Command: $cancel-all-timeouts
            Example: $cancel-all-timeouts 
            Aliases: $cat, $cato, $unmute-all 
            Notes: N/A

            # Get Timeout Stats
            
            Description: Gets all members who are currently timed out in the server and how long until their timeout ends.
            Command: $timeout-stats
            Example: $timeout-stats 
            Aliases: $ts, $tos, $muted
            Notes: N/A

            # Bot Info

            Description: Shows basic info about bot.
            Command: $info
            Example: $info 
            Aliases: N/A
            Notes: N/A

            # Command Info

            Description: You literally just ran this command. How do you not know what it does?
            Command: $commands
            Example: $commands 
            Aliases: $cs
            Notes: N/A


            \`\`\`
        `);
                
           
	}
};