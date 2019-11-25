import { PermissionObject, GuildChannel, PermissionOverwrites, Permissions } from "discord.js";

import { ChannelPermissions } from "../types/types";
import { getArrayOfNonCategoryChannelsForGuild, hasPermissionsInChannel, isUserStillInGuild } from "./guild";
import { AbstractDatabase } from "../types/abstract-db";

export const overwritePermissionsForEachChannelForMember = async (memberID: string, clientID: string, guildID: string, options: PermissionObject): Promise<ChannelPermissions[]> => {
    let channelPermissions: ChannelPermissions[] = [];
    let channels: GuildChannel[] = getArrayOfNonCategoryChannelsForGuild(guildID)
    channels.forEach(async (channel: GuildChannel) => {
        if(hasPermissionsInChannel(guildID, clientID, channel.id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS])) {
            let currentPermissions: PermissionOverwrites = channel.permissionOverwrites.get(memberID);
            if(currentPermissions) {
                channelPermissions.push({
                    guildID,
                    guildChannelID: channel.id,
                    memberID,
                    permissions: JSON.stringify(buildPermissionObject(currentPermissions, options))
                })
            }

            await channel.overwritePermissions(memberID, options)
        }        
    });

    return channelPermissions;
}

function buildPermissionObject(currentPermissions: PermissionOverwrites, options: PermissionObject): PermissionObject {
    let finalPermissionsObject: PermissionObject = {};

    Object.keys(options).forEach(flagName => {
        if(currentPermissions.allowed.serialize()[flagName] === true) {
            finalPermissionsObject[flagName] = true;
        } else if(currentPermissions.denied.serialize()[flagName] === true) {
            finalPermissionsObject[flagName] = false;
        } else {
            finalPermissionsObject[flagName] = null;
        }
    })

    return finalPermissionsObject;
}

export const restorePermissionOverwritesForEachChannelForMember = async (memberID: string, clientID: string, guildID: string, database: AbstractDatabase): Promise<void> => {
    let isMemberStillInGuild: boolean = await isUserStillInGuild(guildID, memberID)
    if(isMemberStillInGuild) {
        let channelPermissionsMap: Map<string, ChannelPermissions> = await database.getAllChannelPermissionsForMemberInGuild(guildID, memberID);
        let channels: GuildChannel[] = getArrayOfNonCategoryChannelsForGuild(guildID)

        channels.forEach(async (channel: GuildChannel) => {
            if(hasPermissionsInChannel(guildID, clientID, channel.id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS])) {
                if(channelPermissionsMap) {
                    let channelPermissions: ChannelPermissions = channelPermissionsMap.get(channel.id);
                    if(channelPermissions) {
                        await channel.overwritePermissions(memberID, JSON.parse(channelPermissions.permissions))
                    } else {
                        await channel.permissionOverwrites.get(memberID).delete('Timeout Over');
                    }
                } else {
                    await channel.permissionOverwrites.get(memberID).delete('Timeout Over');
                }
            }
        })
    }

    await database.removeAllChannelPermissionsForMember(guildID, memberID);
    
}