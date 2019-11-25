import { CommandMessage } from "discord.js-commando";
import { timeoutDB } from "../command-helper/moderation/timeout/timeout-db";
import { Timeout } from "../types/types";
import { MEMBER_ALREADY_TIMED_OUT, MEMBER_HAS_NOT_BEEN_TIMED_OUT_YET } from "../constants/bot-responses";


export function TimeoutPreCondition(action: string) {
    return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
  
        descriptor.value = async function( ... args: any[]) {
            let message: CommandMessage = args[0];
            let timeout: Timeout = await timeoutDB.getTimeoutForMemberByGuild(args[1].member.id, message.guild.id);

            if(!timeout && action === 'START TIMEOUT') {
				return original.apply(this, args);
			} else if(timeout && action === 'END TIMEOUT') {
                return original.apply(this, args);
			} else if(action === 'START TIMEOUT') {
                return message.say(MEMBER_ALREADY_TIMED_OUT);
            } else if(action === 'END TIMEOUT') {
                return message.say(MEMBER_HAS_NOT_BEEN_TIMED_OUT_YET);
            }
        };
  
        return descriptor;
    };
  }