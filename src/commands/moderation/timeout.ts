import { Command, CommandoClient, CommandMessage } from "discord.js-commando";
import { GuildMember, Message } from "discord.js";
import { Observable } from "rxjs";

import { startTimeout, convertInputTimeoutDurationToDate } from "../../command-helper/moderation/timeout/timeout";
import { Timeout, ChannelPermissions, TimeoutInput} from "../../types/types";
import { hasRole, setRoleForMember, removeRoleForMember, isBotStillInGuild } from "../../discord/guild";
import { timeoutDB } from "../../command-helper/moderation/timeout/timeout-db";
import { createOnCancelTimeoutObservable } from "./cancel-timeout";
import { Moderator } from "../../decorators/moderation-decorator";
import { TimeoutPreCondition } from "../../decorators/timeout-decorator";
import { overwritePermissionsForEachChannelForMember, restorePermissionOverwritesForEachChannelForMember } from "../../discord/permissions";
import { GENERIC_ERROR_RESPONSE } from "../../constants/bot-responses";
import { stripIndents } from "common-tags";

export class TimeoutCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'timeout',
			aliases: ['t', 'to', 'mute'],
			group: 'moderation',
			memberName: 'timeout',
			description: 'Puts user in a timeout',
			details: `The tagged user is timed out for the provided time frame.`,
			examples: ['$timeout @baduser 3h'],

			args: [
				{
					key: 'member',
					label: 'Member',
					prompt: 'Provide a member to timeout',
					type: 'member'
                },
                {
					key: 'duration',
					label: 'Timeout Duration',
					prompt: 'Provide the length of time for this timeout',
					type: 'string'
				}
			]
		});
	}

	@Moderator()
	@TimeoutPreCondition('START TIMEOUT')
	async run(message: CommandMessage, input: TimeoutInput): Promise<Message | Message[]> {
		try {
			let {endDate, timeoutDuration, millisecondsToAdd} = convertInputTimeoutDurationToDate(input.duration, new Date());

			let member: GuildMember = input.member;


			let timeout: Timeout = {
				memberID: member.id,
				guild: {
					id: member.guild.id,
					hasRole,
					setRoleForMember,
					removeRoleForMember,
					overwritePermissionsForEachChannelForMember,
					restorePermissionOverwritesForEachChannelForMember
				},
				durationString: timeoutDuration,
				duration: millisecondsToAdd,
				endDate: endDate 
			}
			
			let onCancelTimeout$: Observable<string[]> = createOnCancelTimeoutObservable(member.id, member.guild.id);
	
			
			let channelPermissions: ChannelPermissions[] = await startTimeout(timeout, timeoutDB, this.client.user.id, onCancelTimeout$, isBotStillInGuild);

			await timeoutDB.saveTimeout(timeout);
			if(channelPermissions && channelPermissions.length > 0) {
				await timeoutDB.saveChannelPermissionsForMember(channelPermissions);
			}

			return message.say(`${input.member.displayName} has been timed out for ${timeoutDuration}. 🤡`);
		
		} catch(error) {
			if(error.message == 'Timeouts should be at least 15 seconds long') {
				return message.say(error.message + ', but no more than 7 days long. If you were not expecting this response, then you likely set your timeout well above 7 days.');
			} else {
				console.error(stripIndents`
					There was an error starting ${input.member.displayName}'s timeout
					***** START TIMEOUT ERROR ****
					Target Member: ${input.member.displayName} (${input.member.id})
					Invoking Member: ${message.member.displayName} (${message.member.id})
					Guild Name: ${message.guild.name} (${message.guild.id})

					ERROR: ${error}
					***** END START TIMEOUT ERROR ****
				`)				
				return message.say(GENERIC_ERROR_RESPONSE);
			}
		}
	}
};


