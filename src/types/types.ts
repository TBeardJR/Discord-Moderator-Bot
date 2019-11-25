import { AbstractGuild } from "./abstract-discord";
import { GuildMember } from "discord.js";

export interface Timeout {
    memberID: string
    guild: AbstractGuild
    durationString: string 
    duration: number
    endDate: Date
}

export type DBParam = string | number | null | undefined | Date;

export interface ChannelPermissions {
    guildID: string
    guildChannelID: string
    memberID: string
    permissions: string
}

export interface TimeoutInput {
	member: GuildMember
	duration: string
}

export interface TimeoutDBResponse {
    MEMBER_ID: string,
    GUILD_ID: string,
    DURATION: string 
    END_DATE: string
}
