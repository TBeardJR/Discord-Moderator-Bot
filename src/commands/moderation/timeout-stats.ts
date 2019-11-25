import { Command, CommandoClient, CommandMessage } from "discord.js-commando";
import { Moderator } from "../../decorators/moderation-decorator";
import { timeoutDB } from "../../command-helper/moderation/timeout/timeout-db";
import { TimeoutDBResponse } from "../../types/types";
import { MessageOptions } from "discord.js";
import { convertMillisecondsToDurationString } from "../../command-helper/moderation/timeout/timeout";
import { GENERIC_ERROR_RESPONSE } from "../../constants/bot-responses";
import { stripIndents } from "common-tags";

export class TimeoutStatsCommand extends Command {
     
	constructor(client: CommandoClient) {
		super(client, {
			name: 'timeout-stats',
			aliases: ['ts', 'tos', 'muted'],
			group: 'moderation',
			memberName: 'timeout-stats',
			description: 'Shows who is currently timed out and when their timeout will end',
			details: `here ya go`,
			examples: ['$timeout-stats']
		});
	}

	async run(message: CommandMessage) {

        try {
            let results: TimeoutDBResponse[] = await timeoutDB.getAllTimeoutsForGuild(message.guild.id);

            if(results.length > 0) {
                let today = new Date();
                
                
                let descriptionString: string = '';
                results.forEach((timeoutDBResponse: TimeoutDBResponse) => {
                    let millisecondsLeft: number = new Date(timeoutDBResponse.END_DATE).getTime() - today.getTime();
                    let durationString = convertMillisecondsToDurationString(millisecondsLeft)
                    descriptionString += `<@${timeoutDBResponse.MEMBER_ID}> has ${durationString} left \n`
                })
                let data: MessageOptions = {
                    embed: {
                        title: 'Timed Out Members',
                        color: 0x6e34eb, // Purple
                        description: descriptionString,
                        footer: {text: 'Run $cancel-all-timeouts or $cat to end all timeouts'}
                    }
                }

                return message.say(data);
                
            } else {
                return message.say('No one is currently timed out.');
            }
        } catch(error) {
            console.error(stripIndents`
                There was an error getting timeout stats for guild: ${message.guild.name}
                ***** START TIMEOUT STATS ERROR ****
                Invoking Member: ${message.member.displayName} (${message.member.id})
                Guild Name: ${message.guild.name} (${message.guild.id})

                ERROR: ${error}
                ***** END TIMEOUT STATS ERROR ****
            `)            
            return message.say(GENERIC_ERROR_RESPONSE);
        }
	}
};