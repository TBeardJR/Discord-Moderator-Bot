import 'isomorphic-fetch'; // Avoids TypeError: window.fetch is not a function
import * as sinon from "sinon";
import * as timeunit from "timeunit";

import { Timeout } from "../../../../types/types";
import { startTimeout, continueActiveTimeouts, continueActiveTimeoutForMember, convertInputTimeoutDurationToDate } from "../timeout";
import { AbstractDatabase } from "../../../../types/abstract-db";
import { AbstractGuild } from "../../../../types/abstract-discord";
import { Observable, Subject } from "rxjs";
import { PermissionObject } from "discord.js";


const isBotStillInGuild = () => true;

const clientID = '1000';

const options: PermissionObject = {SEND_MESSAGES: false, CONNECT: false, ADD_REACTIONS: false};

const database: AbstractDatabase = {
    saveTimeout: jest.fn(),
    removeTimeout: jest.fn(),
    saveGuildID: jest.fn(),
    removeGuild: jest.fn(),
    getTimeoutForMemberByGuild: () => null,
    getTimeoutsForAllGuilds: () => Promise.resolve([]),
    saveChannelPermissionsForMember: jest.fn(),
    getAllChannelPermissionsForMemberInGuild: jest.fn(),
    removeAllChannelPermissionsForMember: jest.fn(),
    getAllTimeoutsForGuild: jest.fn(),
    removeAllTimeoutsForGuild: jest.fn(),
    removeAllChannelPermissionsForGuild: jest.fn()
}

const guild: AbstractGuild = {
    id: '500',
    hasRole: () => Promise.resolve(false),
    setRoleForMember: jest.fn(),
    removeRoleForMember: jest.fn(),
    overwritePermissionsForEachChannelForMember: jest.fn(),
    restorePermissionOverwritesForEachChannelForMember: jest.fn()
}

const guild2: AbstractGuild = {
    id: '501',
    hasRole: () => Promise.resolve(false),
    setRoleForMember: jest.fn(),
    removeRoleForMember: jest.fn(),
    overwritePermissionsForEachChannelForMember: jest.fn(),
    restorePermissionOverwritesForEachChannelForMember: jest.fn()
}

const timeout: Timeout = {
    memberID: '1',
    guild: guild,
    duration: 15000,
    durationString: '15s',
    endDate: new Date()
}

const timeout2: Timeout = {
    memberID: '2',
    guild: guild2,
    duration: 15000,
    durationString: '15s',
    endDate: new Date()
}

const onCancelTimeout: Subject<string[]> = new Subject<string[]>();

const onCancelTimeout$: Observable<string[]> = Observable.create((observer) => {
    onCancelTimeout.subscribe(() => {
        observer.next();
        observer.complete();
    });
})

const createOnCancelTimeoutObservable = () => onCancelTimeout$;

const fakeTimer = sinon.useFakeTimers();

describe('Timeout', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        guild.hasRole = () => Promise.resolve(false);
    });

    describe('Start Timeout', () => {

        it('should overwrite channel permissions to timeout member', async () => {
            await startTimeout(timeout, database, clientID, onCancelTimeout$, isBotStillInGuild);

            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, options);

            fakeTimer.runAll();
        });

        it('should restore original channel permissions for member when timer with a duration of 1000ms (1 second) ends', async () => {
            await startTimeout(timeout, database, clientID, onCancelTimeout$, isBotStillInGuild);

            fakeTimer.tick(timeout.duration - 1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(0);
            
            fakeTimer.tick(1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, database);

            fakeTimer.runAll();
        });

        it('should remove timeout from database when timer with a duration of 1000ms (1 second) ends', async () => {
            await startTimeout(timeout, database, clientID, onCancelTimeout$, isBotStillInGuild);

            fakeTimer.tick(timeout.duration - 1);
            expect(database.removeTimeout).toBeCalledTimes(0);
            
            fakeTimer.tick(1);
            expect(database.removeTimeout).toBeCalledTimes(1);
            expect(database.removeTimeout).toBeCalledWith(timeout.memberID, timeout.guild.id);

            fakeTimer.runAll();
        });

        it('should end timeout when moderator/admin manually ends timeout before timer ends', async () => {
            await startTimeout(timeout, database, clientID, onCancelTimeout$, isBotStillInGuild);

            fakeTimer.tick(timeout.duration - 1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(0);
            expect(database.removeTimeout).toBeCalledTimes(0);

            onCancelTimeout.next();
            
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, database);
            expect(database.removeTimeout).toBeCalledTimes(1);
            expect(database.removeTimeout).toBeCalledWith(timeout.memberID, timeout.guild.id);

            fakeTimer.runAll();
        });

        it('should not overwrite channel permissions to timeout member when bot is not in guild', async () => {
            await startTimeout(timeout, database, clientID, onCancelTimeout$, () => false);

            onCancelTimeout.next();

            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(0);
            expect(database.removeTimeout).toBeCalledTimes(0);

            fakeTimer.runAll();
        });
       
    });

    describe('Continue Active Timeouts (Assumed server restart)', () => {

        beforeAll(() => {
            guild.timeouts = [timeout];
            guild2.timeouts = [timeout2];
        })

        it('should continue all active timeouts for one guild', async () => {
            database.getTimeoutsForAllGuilds = () => Promise.resolve([guild]);

            await continueActiveTimeouts(database, clientID, createOnCancelTimeoutObservable, isBotStillInGuild);

            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, options);

            fakeTimer.runAll();
        });
        it('should continue all active timeouts for multiple guilds', async () => {
           
            database.getTimeoutsForAllGuilds = () => Promise.resolve([guild,guild2]);

            await continueActiveTimeouts(database, clientID, createOnCancelTimeoutObservable, isBotStillInGuild);

            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, options);

            expect(guild2.overwritePermissionsForEachChannelForMember).toBeCalledTimes(1);
            expect(guild2.overwritePermissionsForEachChannelForMember).toBeCalledWith(timeout2.memberID, clientID, timeout2.guild.id, options);

            fakeTimer.runAll();
        });

        it('should restore original channel permissions for members when active timeouts are done', async () => {
            await continueActiveTimeouts(database, clientID, createOnCancelTimeoutObservable, isBotStillInGuild);

            fakeTimer.tick(timeout.duration - 1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(0);
            expect(guild2.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(0);
            
            fakeTimer.tick(1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, database);

            expect(guild2.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(1);
            expect(guild2.restorePermissionOverwritesForEachChannelForMember).toBeCalledWith(timeout2.memberID, clientID, timeout2.guild.id, database);

            fakeTimer.runAll();
        });
    })

    describe('Continue Active Timeout For One Member (Assumes member leaves and rejoins guild)', () => {
        it('should continue timeout for user', async () => {
            database.getTimeoutForMemberByGuild = (memberID: string, guildID: string) => {
                if(memberID === timeout.memberID && guildID === timeout.guild.id)
                    return Promise.resolve(timeout);
            }

            await continueActiveTimeoutForMember(timeout.memberID, timeout.guild.id, clientID, database, createOnCancelTimeoutObservable, isBotStillInGuild);

            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, options);

            fakeTimer.tick(timeout.duration - 1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(0);
            
            fakeTimer.tick(1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledTimes(1);
            expect(guild.restorePermissionOverwritesForEachChannelForMember).toBeCalledWith(timeout.memberID, clientID, timeout.guild.id, database);

            fakeTimer.runAll();
        })

        it('should NOT continue timeout for user if they have no active timeout for guild', async () => {
            database.getTimeoutForMemberByGuild = () => Promise.resolve(null);
            
            await continueActiveTimeoutForMember(timeout.memberID, timeout.guild.id, clientID, database, createOnCancelTimeoutObservable, isBotStillInGuild);

            expect(guild.overwritePermissionsForEachChannelForMember).toBeCalledTimes(0);
        })
    });

    describe('Convert Input Timeout Duration To Date', () => {
        it('should convert a 15s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.seconds.toMillis(15));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('15s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('15s');
        })

        it('should convert a 1m timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.minutes.toMillis(1));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1m', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1m');
        })

        it('should convert a 1h timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.hours.toMillis(1));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1h', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1h');
        })

        it('should convert a 1d timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(1));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1d', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1d');
        })

        it('should convert a 1m30s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.minutes.toMillis(1) + timeunit.seconds.toMillis(30));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1m30s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1m30s');
        })

        it('should convert a 1h30m30s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.hours.toMillis(1) + timeunit.minutes.toMillis(30) + timeunit.seconds.toMillis(30));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1h30m30s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1h30m30s');
        })

        it('should convert a 1d12h30m30s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(1) + timeunit.hours.toMillis(12) + timeunit.minutes.toMillis(30) + timeunit.seconds.toMillis(30));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1d12h30m30s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1d12h30m30s');
        })

        it('should convert a 1d30s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(1) + timeunit.seconds.toMillis(30));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1d30s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1d30s');
        })

        it('should convert a 1d30m timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(1) + timeunit.minutes.toMillis(30));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1d30m', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1d30m');
        })

        it('should convert a 1d5h timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(1) + timeunit.hours.toMillis(5));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1d5h', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1d5h');
        })

        it('should convert a 5h01s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.hours.toMillis(5) + timeunit.seconds.toMillis(1));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('5h01s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('5h1s');
        })

        it('should convert a 01h27m timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.hours.toMillis(1) + timeunit.minutes.toMillis(27));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('01h27m', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1h27m');
        })

        it('should convert a 00m30s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.seconds.toMillis(30));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('00m30s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('0m30s');
        })

        it('should convert a 00h00m40s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.seconds.toMillis(40));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('00h00m40s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('0h0m40s');
        })

        it('should convert a 00d00h20m40s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.minutes.toMillis(20) + timeunit.seconds.toMillis(40));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('00d00h20m40s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('0d0h20m40s');
        })

        it('should convert a 1d1h1m1s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(1) + timeunit.hours.toMillis(1) + timeunit.minutes.toMillis(1) + timeunit.seconds.toMillis(1));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1d1h1m1s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1d1h1m1s');
        })

        it('should convert a 6d23h59m59s timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(6) + timeunit.hours.toMillis(23) + timeunit.minutes.toMillis(59) + timeunit.seconds.toMillis(59));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('6d23h59m59s', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('6d23h59m59s');
        })

        it('should convert a 7d timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(7));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('7d', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('7d');
        })

        it('should convert a 1w timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(7));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('1w', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1w');
        })

        it('should convert a 7d5h timeout to a 1w timeout', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(7));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('7d5h', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('1w');
        })

        it('should throw exception when timeout is less than 15 seconds', () => {
            expect(() => convertInputTimeoutDurationToDate('00d00h00m14s', new Date())).toThrow(Error);
            expect(() => convertInputTimeoutDurationToDate('00d00h00m00s', new Date())).toThrow(Error);
        })

        it('should convert a ggggg89899886dfdasfas5dfas$$$%$%$%$25h timeout correctly', () => {
            let today: Date = new Date();
            let expectedEndDate = new Date(today.getTime() + timeunit.days.toMillis(6) + timeunit.hours.toMillis(5));
            let { endDate, timeoutDuration } = convertInputTimeoutDurationToDate('6d5h', today);

            expect(endDate).toEqual(expectedEndDate);
            expect(timeoutDuration).toEqual('6d5h');
        })
       
        
    })
});