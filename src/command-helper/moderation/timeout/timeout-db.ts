import { Timeout, ChannelPermissions, DBParam, TimeoutDBResponse } from "../../../types/types";
import { query } from "../../../database/database";
import { hasRole, setRoleForMember, removeRoleForMember} from "../../../discord/guild";
import { AbstractGuild } from "../../../types/abstract-discord";
import { AbstractDatabase } from "../../../types/abstract-db";
import * as queries from "../../../database/queries";
import { convertInputTimeoutDurationToDate } from "./timeout";
import { overwritePermissionsForEachChannelForMember, restorePermissionOverwritesForEachChannelForMember } from "../../../discord/permissions";


export const timeoutDB: AbstractDatabase = {
    saveTimeout,
    removeTimeout,
    removeGuild,
    getTimeoutForMemberByGuild,
    getTimeoutsForAllGuilds,
    saveGuildID,
    saveChannelPermissionsForMember,
    getAllChannelPermissionsForMemberInGuild,
    removeAllChannelPermissionsForMember,
    getAllTimeoutsForGuild,
    removeAllTimeoutsForGuild,
    removeAllChannelPermissionsForGuild
}

async function saveTimeout(timeout: Timeout): Promise<void> {
    await query(queries.SAVE_TIMEOUT, [timeout.memberID, timeout.guild.id, timeout.durationString, timeout.endDate]);
};

async function removeTimeout(memberID: string, guildID: string) {
    await query(queries.REMOVE_TIMEOUT, [memberID, guildID]);
};

async function saveGuildID(guildID: string): Promise<void> {
    await query(queries.SAVE_GUILD_ID, [guildID]);
};

async function removeGuild(guildID: string): Promise<void> {
    await query(queries.REMOVE_GUILD, [guildID]);
};

async function getAllTimeoutsForGuild(guildID: string): Promise<TimeoutDBResponse[]> {
    return await query(queries.GET_ALL_TIMEOUTS_FOR_GUILD, [guildID]);
};

async function removeAllTimeoutsForGuild(guildID: string): Promise<void> {
    await query(queries.REMOVE_ALL_TIMEOUTS_FOR_GUILD, [guildID]);
};

async function saveChannelPermissionsForMember(channelPermissions: ChannelPermissions[]): Promise<void> {
    let dbParams: DBParam[][] = [];
    channelPermissions.forEach((channelPermissions) => dbParams.push([channelPermissions.guildID, channelPermissions.guildChannelID, channelPermissions.memberID, channelPermissions.permissions]));
    
    await query(queries.SAVE_CHANNEL_PERMISSIONS, [dbParams]);
}

async function removeAllChannelPermissionsForGuild(guildID: string): Promise<void> {
    await query(queries.REMOVE_CHANNEL_PERMISSIONS_FOR_GUILD, [guildID]);
};

async function getAllChannelPermissionsForMemberInGuild(guildID: string, memberID: string): Promise<Map<string, ChannelPermissions>> {
    let results = await query(queries.GET_CHANNEL_PERMISSIONS, [memberID, guildID]);
    let channelPermissions: Map<string, ChannelPermissions> = new Map();
    if(results[0]) {
        results.forEach(result => {
            channelPermissions.set(result.GUILD_CHANNEL_ID, {
                guildID: result.GUILD_ID,
                guildChannelID: result.GUILD_CHANNEL_ID,
                memberID: result.MEMBER_ID,
                permissions: result.PERMISSIONS
            })
        })

        return channelPermissions;
    }

    return results[0];
    
}

async function removeAllChannelPermissionsForMember(guildID: string, memberID: string): Promise<void> {
    await query(queries.REMOVE_CHANNEL_PERMISSIONS, [memberID, guildID]);
}


async function getTimeoutForMemberByGuild(memberID: string, guildID: string): Promise<Timeout> {
    let results = await query(queries.GET_TIMEOUT_FOR_MEMBER_BY_GUILD, [memberID, guildID]);
    if(results[0]) {
        return {
            memberID: results[0].MEMBER_ID,
            guild: {
                id: results[0].GUILD_ID,
                hasRole,
                setRoleForMember,
                removeRoleForMember,
                overwritePermissionsForEachChannelForMember,
				restorePermissionOverwritesForEachChannelForMember
            },
            duration: convertInputTimeoutDurationToDate(results[0].DURATION, new Date()).millisecondsToAdd,
            durationString: results[0].DURATION,
            endDate: results[0].END_DATE
        }
    }

    return results[0];
   
};

async function getTimeoutsForAllGuilds(clientID: string, database: AbstractDatabase): Promise<AbstractGuild[]> {
    let results: any[] = await query(queries.GET_ALL_TIMEOUTS);

    let guilds: AbstractGuild[] = [];
    let guildMap: Map<string, AbstractGuild> = new Map();
    results.forEach(async (result) => {
        let endDate = new Date(result.END_DATE);

        let timeout: Timeout = {
            memberID: result.MEMBER_ID,
            guild: null,
            duration: convertInputTimeoutDurationToDate(result.DURATION, new Date()).millisecondsToAdd,
            durationString: result.DURATION,
            endDate: endDate
        }

        if(!isTimeoutOver(endDate)) {
            if(guildMap.has(result.GUILD_ID)) {
                timeout.guild = guildMap.get(result.GUILD_ID);
                guildMap.get(result.GUILD_ID).timeouts.push(timeout);
            } else {
                let guild: AbstractGuild = {
                    id: result.GUILD_ID,
                    hasRole,
                    setRoleForMember,
                    removeRoleForMember,
                    overwritePermissionsForEachChannelForMember,
				    restorePermissionOverwritesForEachChannelForMember
                }
                timeout.guild = guild;
                guild.timeouts = [timeout];
                guildMap.set(result.GUILD_ID, guild);
                guilds.push(guild);
            }
        } else {
            if(guildMap.get(result.GUILD_ID)) {
                timeout.guild = guildMap.get(result.GUILD_ID);
            } else {
                timeout.guild = {
                    id: result.GUILD_ID,
                    hasRole,
                    setRoleForMember,
                    removeRoleForMember,
                    overwritePermissionsForEachChannelForMember,
				    restorePermissionOverwritesForEachChannelForMember
                }
            }
            
            await removeTimeout(timeout.memberID, timeout.guild.id);
            await timeout.guild.restorePermissionOverwritesForEachChannelForMember(timeout.memberID, clientID, timeout.guild.id, database);
        }
    });

    return guilds;
};

function isTimeoutOver(endDate: Date): boolean {
    return new Date().getTime() - endDate.getTime() > 0
}