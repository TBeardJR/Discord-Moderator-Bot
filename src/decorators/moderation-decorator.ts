import { CommandMessage } from "discord.js-commando";
import { Permissions, GuildMember } from "discord.js";
import { hasPermissionsInGuild, getClientID } from "../discord/guild";
import { CAN_NOT_MODERATE_SELF, CAN_NOT_MODERATE_OWNER, MISSING_MANAGE_CHANNEL_AND_ROLES_PERMISSIONS, CAN_NOT_MODERATE_ADMINISTRATOR, CAN_NOT_MODERATE_OTHER_MODS, CAN_NOT_MODERATE_BOTS } from "../constants/bot-responses";

const NOTHING = 'Nothing';

const validationMap: Map<string, (message: CommandMessage, targetMember?: GuildMember) => boolean> = new Map(
    [
        [NOTHING, (message) => hasPermissionsInGuild(message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS])],
        [CAN_NOT_MODERATE_SELF, (message, targetMember) => !targetMember || targetMember.id !== message.member.id],
        [CAN_NOT_MODERATE_OWNER, (message, targetMember) => !targetMember || targetMember.id !== message.guild.owner.id],
        [CAN_NOT_MODERATE_ADMINISTRATOR, (message, targetMember) => !targetMember || !hasPermissionsInGuild(message.guild.id, targetMember.id, [Permissions.FLAGS.ADMINISTRATOR])],
        [CAN_NOT_MODERATE_OTHER_MODS, (message, targetMember) => !targetMember || !hasPermissionsInGuild(message.guild.id, targetMember.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS])],
        [MISSING_MANAGE_CHANNEL_AND_ROLES_PERMISSIONS, (message) => hasPermissionsInGuild(message.guild.id, getClientID(), [Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_ROLES])],
        [CAN_NOT_MODERATE_BOTS, (message, targetMember) => !targetMember || !targetMember.user.bot]
    ]
)

export function Moderator() {
    return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
  
        descriptor.value = function( ... args: any[]) {
            let message: CommandMessage = args[0];
            let targetMember: GuildMember = null;
            if(args[1]) {
                targetMember = args[1].member;
            }

            for(const [errorMessage, validationFunction] of validationMap.entries()) {
                let response: string = validate(validationFunction, errorMessage, message, targetMember)
                if(response) {
                    if(response != NOTHING) {
                        return message.say(response);
                    } else {
                        return undefined;
                    }
                }
            }

            return original.apply(this, args);
        };
  
      return descriptor;
    };
  }


function validate(executeValidation: (message: CommandMessage, targetMember?: GuildMember) => boolean, response: string, message: CommandMessage, targetMember?: GuildMember) {
    if(executeValidation(message, targetMember)) {
        return '';
    } else {
        return response;
    }
}