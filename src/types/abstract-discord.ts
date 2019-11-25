import { Timeout, ChannelPermissions } from "./types";
import { PermissionObject } from "discord.js";
import { AbstractDatabase } from "./abstract-db";

export interface AbstractGuild {
    id: string
    timeouts?: Timeout[]
    hasRole: (roleID: string, guildID: string) => Promise<boolean>
    setRoleForMember: (memberID: string, guildID: string, roleID: string) => Promise<void> 
    removeRoleForMember: (memberID: string, guildID: string, roleID: string) => Promise<void>
    overwritePermissionsForEachChannelForMember: (memberID: string, clientID: string, guildID: string, options: PermissionObject) => Promise<ChannelPermissions[]>
    restorePermissionOverwritesForEachChannelForMember: (memberID: string, clientID: string, guildID: string, database: AbstractDatabase) => Promise<void>
}