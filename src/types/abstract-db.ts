import { Timeout, ChannelPermissions, TimeoutDBResponse } from "./types";
import { AbstractGuild } from "./abstract-discord";

export interface AbstractDatabase {
    saveTimeout: (timeout: Timeout) => Promise<void>
    removeTimeout: (memberID: string, guildID: string) => Promise<void>
    saveGuildID: (guildID: string) => Promise<void>
    removeGuild: (guildID: string) => Promise<void>
    getTimeoutForMemberByGuild: (memberID: string, guildID: string) => Promise<Timeout>
    getTimeoutsForAllGuilds: (clientID: string, database: AbstractDatabase) => Promise<AbstractGuild[]>
    saveChannelPermissionsForMember: (channelPermissions: ChannelPermissions[]) => Promise<void>
    getAllChannelPermissionsForMemberInGuild: (guildID: string, memberID: string) => Promise<Map<string, ChannelPermissions>>
    removeAllChannelPermissionsForMember: (guildID: string, memberID: string) => Promise<void>
    getAllTimeoutsForGuild: (guildID: string) => Promise<TimeoutDBResponse[]>
    removeAllTimeoutsForGuild: (guildID: string) => Promise<void>
    removeAllChannelPermissionsForGuild: (guildID: string) => Promise<void>
}