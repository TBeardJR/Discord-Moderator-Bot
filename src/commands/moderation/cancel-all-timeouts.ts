import { Command, CommandoClient, CommandMessage } from "discord.js-commando";
import { GuildMember} from "discord.js";
import { Subject, Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { Moderator } from "../../decorators/moderation-decorator";
import { timeoutDB } from "../../command-helper/moderation/timeout/timeout-db";
import { onCancelTimeout } from "./cancel-timeout";
import { GENERIC_ERROR_RESPONSE } from "../../constants/bot-responses";
import { stripIndents } from "common-tags";


export class CancelAllTimeoutsCommand extends Command {
     
	constructor(client: CommandoClient) {
		super(client, {
			name: 'cancel-all-timeouts',
			aliases: ['cat', 'cato', 'unmute-all'],
			group: 'moderation',
			memberName: 'cancel-all-timeout',
			description: 'Cancels timeouts for members',
			details: `No one is timed out anymore`,
			examples: ['$cancel-all-timeouts']
		});
	}

	@Moderator()
	async run(message: CommandMessage) {

		try {
			let results: any[] = await timeoutDB.getAllTimeoutsForGuild(message.guild.id);
			results.forEach(result => {
				onCancelTimeout.next([result.MEMBER_ID, result.GUILD_ID])
			})
					
			return message.say(`All timeouts have been cancelled.`);

		} catch(error) {
			console.error(stripIndents`
				There was an error cancelling all timeouts for guild: ${message.guild.name}
				***** START CANCEL ALL TIMEOUTS ERROR ****
				Invoking Member: ${message.member.displayName} (${message.member.id})
				Guild Name: ${message.guild.name} (${message.guild.id})

				ERROR: ${error}
				***** END CANCEL ALL TIMEOUTS ERROR ****
			`) 			
			return message.say(GENERIC_ERROR_RESPONSE);
		}
		
	}
};