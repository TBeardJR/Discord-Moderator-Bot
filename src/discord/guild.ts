import { client } from "../commando-client";
import { Guild, GuildMember, GuildChannel} from "discord.js";

export const hasRole = async (roleID: string, guildID: string): Promise<boolean> => {
    let guild: Guild = client.guilds.get(guildID);
    return await guild.roles.has(roleID);
};

export const setRoleForMember = async (memberID: string, guildID: string, roleID: string): Promise<void> => {
    let member: GuildMember = client.guilds.get(guildID).members.get(memberID);
    if(member && await !member.roles.has(roleID)) {
        await member.addRole(roleID);
    }
};

export const removeRoleForMember = async (memberID: string, guildID: string, roleID: string): Promise<void> => {
    let member: GuildMember = client.guilds.get(guildID).members.get(memberID);
    if(member && await member.roles.has(roleID)) {
        await member.removeRole(roleID);
    }
};

export const isBotStillInGuild = (guildID: string): boolean => {
    if(client.guilds.get(guildID)) {
        return true;
    } else {
        return false;
    }
};

export const isUserStillInGuild = async (guildID: string, memberID: string): Promise<boolean> => {
    let guild: Guild = await client.guilds.get(guildID)
    if(guild.members.get(memberID)) {
        return true;
    } else {
        return false;
    }
};

export const hasPermissionsInGuild = (guildID: string, memberID: string, permissions: number[]): boolean => {
    let hasAllPermissions = true;
    for(let i = 0; i < permissions.length; i++) {
        if(!client.guilds.get(guildID).members.get(memberID).hasPermission(permissions[i])) {
            hasAllPermissions = false;
            break;
        }
    }
    return hasAllPermissions;
}

export const hasPermissionsInChannel = (guildID: string, memberID: string, channelID: string, permissions: number[]): boolean => {
    let hasAllPermissions = true;
    let member: GuildMember = client.guilds.get(guildID).members.get(memberID);
    for(let i = 0; i < permissions.length; i++) {
        if(!client.guilds.get(guildID).channels.get(channelID).memberPermissions(member).has(permissions[i])) {
            hasAllPermissions = false;
            break;
        }
    }
    return hasAllPermissions;
}

export const getGuild = (guildID: string) => {
    return client.guilds.get(guildID);
}

export const getClientID = () => {
    return client.user.id;
}

export const getArrayOfNonCategoryChannelsForGuild = (guildID: string): GuildChannel[] => {
    let guild: Guild = client.guilds.get(guildID)
    return guild.channels.array().filter(channel => channel.type !== 'category')
}

