import { Command, CommandoClient, CommandMessage } from "discord.js-commando";
import { GuildMember} from "discord.js";
import { Subject, Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { Moderator } from "../../decorators/moderation-decorator";
import { TimeoutPreCondition } from "../../decorators/timeout-decorator";
import { timeoutDB } from "../../command-helper/moderation/timeout/timeout-db";
import { restorePermissionOverwritesForEachChannelForMember } from "../../discord/permissions";
import { Timeout } from "../../types/types";
import { GENERIC_ERROR_RESPONSE } from "../../constants/bot-responses";
import { stripIndents } from "common-tags";

export const onCancelTimeout: Subject<string[]> = new Subject<string[]>();

export class CancelTimeoutCommand extends Command {
     
	constructor(client: CommandoClient) {
		super(client, {
			name: 'cancel-timeout',
			aliases: ['ct', 'cto', 'unmute'],
			group: 'moderation',
			memberName: 'cancel-timeout',
			description: 'Cancels timeout for member',
			details: `The tagged user is no longer timed out`,
			examples: ['$cancel-timeout @baduser'],

			args: [
				{
					key: 'member',
					label: 'Member',
					prompt: 'Provide a member to untimeout',
					type: 'member'
                }
			]
		});
	}

	@Moderator()
	@TimeoutPreCondition('END TIMEOUT')
	async run(message: CommandMessage, input: TimeoutInput) {
		try {
			onCancelTimeout.next([input.member.id, message.guild.id, 'MANUAL CANCEL'])

			await restorePermissionOverwritesForEachChannelForMember(input.member.id, this.client.user.id, message.guild.id, timeoutDB);
			await timeoutDB.removeTimeout(input.member.id, message.guild.id);
					
			return message.say(`${input.member.displayName} is no longer timed out`);
		} catch(error) {
			console.error(stripIndents`
				There was an error canceling ${input.member.displayName}'s timeout
				***** START CANCEL TIMEOUT ERROR ****
				Target Member: ${input.member.displayName} (${input.member.id})
				Invoking Member: ${message.member.displayName} (${message.member.id})
				Guild Name: ${message.guild.name} (${message.guild.id})

				ERROR: ${error}
				***** END CANCEL TIMEOUT ERROR ****
			`)
			return message.say(GENERIC_ERROR_RESPONSE);
		}
		
	}
};

export function createOnCancelTimeoutObservable(memberID: string, guildID: string): Observable<string[]> {
    return onCancelTimeout.asObservable()  
        .pipe(
            filter(value => value[0] === memberID && value[1] === guildID)
        );
}


interface TimeoutInput {
	member: GuildMember,
	duration: string
}