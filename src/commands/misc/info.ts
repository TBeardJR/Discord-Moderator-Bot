import { Command, CommandoClient, CommandMessage } from "discord.js-commando";
import { MessageOptions } from "discord.js";
import { stripIndent } from "common-tags";

export class InfoCommand extends Command {
     
	constructor(client: CommandoClient) {
		super(client, {
			name: 'info',
			group: 'misc',
			memberName: 'info',
			description: 'Basic Info on Bot',
			details: `Basic Info on Bot`,
			examples: ['$info']
		});
	}

	async run(message: CommandMessage) {
        let data: MessageOptions = {
            embed: {
                author: {name: `🐱‍🚀 ${this.client.user.username} 🐱‍🚀`},
                title: '🔥🔥🔥🔥🔥🔥    🚒💨',
                color: 0x6e34eb, // Purple
                fields: [
                    {name: 'Prefix', value: '$', inline: true},
                    {name: 'Owner', value: `<@294645230857355265>`, inline: true},
                    {name: 'Description', value: 'Simple bot that can timeout 🤡🤡🤡🤡'},
                    {name: 'Commands', value: stripIndent`
                        $timeout
                        $cancel-all-timeouts
                        $cancel-timeout
                        $timeout-stats
                    `}
                ],
                footer: {text: 'Run $commands for help on how to use commands'}
                
            }
        }

        return message.reply(data);
                
           
	}
};