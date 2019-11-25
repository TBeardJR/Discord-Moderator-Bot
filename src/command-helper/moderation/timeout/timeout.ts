import { timer, Observable, race } from "rxjs";
import * as timeunit from "timeunit";

import { Timeout, ChannelPermissions } from "../../../types/types";
import { AbstractDatabase } from "../../../types/abstract-db";
import { AbstractGuild } from "../../../types/abstract-discord";

export async function startTimeout(timeout: Timeout, database: AbstractDatabase, clientID: string, onCancelTimeout$: Observable<string[]>, isBotStillInGuild: (guildID: string) => boolean): Promise<ChannelPermissions[]> {
    let channelPermissions: ChannelPermissions[] = await timeout.guild.overwritePermissionsForEachChannelForMember(timeout.memberID, clientID, timeout.guild.id, {SEND_MESSAGES: false, CONNECT: false, ADD_REACTIONS: false});
    
    race(timer(timeout.duration), onCancelTimeout$).subscribe((value: string[]) => {
        if(!value || (!value[2] && isBotStillInGuild(timeout.guild.id))) {
            if(isBotStillInGuild(timeout.guild.id)) {
                timeout.guild.restorePermissionOverwritesForEachChannelForMember(timeout.memberID, clientID, timeout.guild.id, database);
                database.removeTimeout(timeout.memberID, timeout.guild.id);
            }
        }
    });

    return channelPermissions;
}

export async function continueActiveTimeouts(database: AbstractDatabase, clientID: string, createOnCancelTimeoutObservable: (memberID: string, guildID: string) => Observable<string[]>, isBotStillInGuild: (guildID: string) => boolean): Promise<void> {
    let guilds: AbstractGuild[] = await database.getTimeoutsForAllGuilds(clientID, database); 
    for(let guild of guilds) {
        for(let timeout of guild.timeouts) {
            let onCancelTimeout$: Observable<string[]> = createOnCancelTimeoutObservable(timeout.memberID, timeout.guild.id);
            await startTimeout(timeout, database, clientID, onCancelTimeout$, isBotStillInGuild);
        }
    }
}

export async function continueActiveTimeoutForMember(memberID: string, guildID: string, clientID: string, database: AbstractDatabase, createOnCancelTimeoutObservable: (memberID: string, guildID: string) => Observable<string[]>, isBotStillInGuild: (guildID: string) => boolean) {
    let timeout: Timeout = await database.getTimeoutForMemberByGuild(memberID, guildID);
    if(timeout) {
        let onCancelTimeout$: Observable<string[]> = createOnCancelTimeoutObservable(memberID, guildID);
        await startTimeout(timeout, database, clientID, onCancelTimeout$, isBotStillInGuild)
    }
}

export function convertInputTimeoutDurationToDate(inputTimeoutDuration: string, today: Date): {endDate: Date, timeoutDuration: string, millisecondsToAdd: number} {
    let millisecondsToAdd = 0;
    let timeoutDuration = '';

    let timeoutConversionSecondsRegex = /([0-5]?[0-9])s/;
    let timeoutConversionMinutesRegex = /([0-5]?[0-9])m/;
    let timeoutConversionHoursRegex = /([01]?[0-9]|2[0-3])h/;
    let timeoutConversionDaysRegex = /([0-7])d/;
    let timeoutConversionWeeksRegex = /(1)w/;

    let seconds: RegExpMatchArray = inputTimeoutDuration.match(timeoutConversionSecondsRegex);
    let minutes: RegExpMatchArray = inputTimeoutDuration.match(timeoutConversionMinutesRegex);
    let hours: RegExpMatchArray = inputTimeoutDuration.match(timeoutConversionHoursRegex);
    let days: RegExpMatchArray = inputTimeoutDuration.match(timeoutConversionDaysRegex);
    let weeks: RegExpMatchArray = inputTimeoutDuration.match(timeoutConversionWeeksRegex);

    if(weeks) {
        millisecondsToAdd += timeunit.days.toMillis(7);
        timeoutDuration = '1w'
    } else {
        if(days) {
            millisecondsToAdd += timeunit.days.toMillis(parseInt(days[1]))
            timeoutDuration += `${parseInt(days[1])}d`
        }
        if(hours) {
            millisecondsToAdd += timeunit.hours.toMillis(parseInt(hours[1]))
            timeoutDuration += `${parseInt(hours[1])}h`
        }
        if(minutes) {
            millisecondsToAdd += timeunit.minutes.toMillis(parseInt(minutes[1]))
            timeoutDuration += `${parseInt(minutes[1])}m`
        }
        if(seconds) {
            millisecondsToAdd += timeunit.seconds.toMillis(parseInt(seconds[1]))
            timeoutDuration += `${parseInt(seconds[1])}s`
        }
    }

    if(millisecondsToAdd < 15000) {
        throw new Error('Timeouts should be at least 15 seconds long');
    }

    if(millisecondsToAdd > timeunit.days.toMillis(7)) {
        millisecondsToAdd = timeunit.days.toMillis(7);
        timeoutDuration = '1w'
    }

    return {
        endDate: new Date(today.getTime() + millisecondsToAdd),
        timeoutDuration,
        millisecondsToAdd
    }
}

export function convertMillisecondsToDurationString(milliseconds: number): string {
    // Convert to seconds:
    let seconds = milliseconds / 1000;
    // Convert to hours
    let hours = seconds / 3600 ; // 3,600 seconds in 1 hour
    // Convert to days
    let days = hours / 24;

    hours = hours % 24; // hours remaining after extracting days

    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract remaining minutes:
    let minutes = seconds / 60 ; // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;

    let durationString = '';

    if(days >= 1) {
        durationString += (Math.ceil(days) === 7 ? 6: Math.ceil(days)) + 'd '
    }
    if(hours >= 1) {
        durationString += (Math.ceil(hours) === 24 ? 23 : Math.ceil(hours)) + 'h '
    }
    if(minutes >= 1) {
        durationString += (Math.ceil(minutes) === 60 ? 59 : Math.ceil(minutes)) + 'm '
    }
    if(seconds >= 1) {
        durationString += (Math.ceil(seconds) === 60 ? 59 : Math.ceil(seconds)) + 's '
    }

    return durationString;
}