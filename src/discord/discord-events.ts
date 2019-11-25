import { Subject, Observable } from "rxjs";
import { Guild, GuildMember, Role } from "discord.js";
import { client } from "../commando-client";
import { timeoutDB } from "../command-helper/moderation/timeout/timeout-db";
import { continueActiveTimeoutForMember } from "../command-helper/moderation/timeout/timeout";
import { createOnCancelTimeoutObservable, onCancelTimeout } from "../commands/moderation/cancel-timeout";
import { isBotStillInGuild } from "./guild";

const onReady: Subject<void> = new Subject<void>();
const onGuildCreate: Subject<Guild> = new Subject<Guild>();
const onGuildMemberAdd: Subject<GuildMember> = new Subject<GuildMember>();
const onRoleCreate: Subject<Role> = new Subject<Role>();
const onRoleDelete: Subject<Role> = new Subject<Role>();
const onGuildDelete: Subject<Role> = new Subject<Role>();

export const onReady$: Observable<void> = onReady.asObservable();
export const onGuildCreate$: Observable<Guild> = onGuildCreate.asObservable();
export const onGuildMemberAdd$: Observable<GuildMember> = onGuildMemberAdd.asObservable();
export const onRoleCreate$: Observable<Role> = onRoleCreate.asObservable();
export const onRoleDelete$: Observable<Role> = onRoleDelete.asObservable();
export const onGuildDelete$: Observable<Role> = onGuildDelete.asObservable();



export function createDiscordEventHandlers() {
    createOnReadyHandler();
    createOnGuildCreateHandler();
    createOnGuildMemberAddHandler();
    createOnRoleCreateHandler();
    createOnRoleDeleteHandler();
    createOnGuildDeleteHandler();
}

function createOnReadyHandler() { 
    client.on('ready', () => onReady.next());    
}

function createOnGuildCreateHandler() {
    client.on('guildCreate', async (guild: Guild) => {
        await timeoutDB.saveGuildID(guild.id)
        onGuildCreate.next(guild)
    });
}

function createOnGuildMemberAddHandler() {
    client.on('guildMemberAdd', async (member: GuildMember) => {
        await continueActiveTimeoutForMember(member.id, member.guild.id, client.user.id, timeoutDB, createOnCancelTimeoutObservable, isBotStillInGuild);
        onGuildMemberAdd.next(member)
    });
}

function createOnRoleCreateHandler() {
    client.on('roleCreate', (role: Role) => onRoleCreate.next(role))
}

function createOnRoleDeleteHandler() {
    client.on('roleDelete', (role: Role) => {
        onRoleDelete.next(role);
    });
}

function createOnGuildDeleteHandler() {
    client.on('guildDelete', async (guild: Guild) => {
        let results: any[] = await timeoutDB.getAllTimeoutsForGuild(guild.id);
        results.forEach(result => {
            onCancelTimeout.next([result.MEMBER_ID, result.GUILD_ID])
        })

        await timeoutDB.removeAllTimeoutsForGuild(guild.id);
        await timeoutDB.removeAllChannelPermissionsForGuild(guild.id)
        await timeoutDB.removeGuild(guild.id);
        
    });
}