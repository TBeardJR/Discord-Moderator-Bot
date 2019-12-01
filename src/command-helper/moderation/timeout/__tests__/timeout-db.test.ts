import 'isomorphic-fetch';

import { Timeout } from "../../../../types/types";
import { AbstractGuild } from "../../../../types/abstract-discord";
import * as queries from "../../../../database/queries";


const today = new Date();

jest.mock("../../../../discord/guild");


const setupMock = (returnValue) => {
    jest.doMock("../../../../database/database", () => {
        return {
            query: jest.fn().mockImplementation(() => returnValue),
            onDBConnection$: {
                subscribe: jest.fn()
            }
        }
    })

    const { query } = require('../../../../database/database')
    const { timeoutDB } = require('../../../../command-helper/moderation/timeout/timeout-db');

    return {
        query,
        timeoutDB
    }
}



describe('Timeout DB', () => {

    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    }); 
      
    describe('Get Timeout For Member By Guild', () => {
        it('should return correctly formatted object when timeout is found', async () => {
            const {query, timeoutDB} = setupMock(
                [{
                    MEMBER_ID: '100',
                    GUILD_ID: '9999',
                    DURATION: '15s',
                    END_DATE: today
                }]
            );
            
            const memberID = '100';
            const guildID = '9999';
    
            const expectedResult = {
                memberID: memberID,
                guild: {
                    id: guildID,
                },
                duration: 15000,
                durationString: '15s',
                endDate: today
            }
    
            let result: Timeout = await timeoutDB.getTimeoutForMemberByGuild(memberID, guildID);
    
            expect(query).toBeCalled();
            expect(result).toMatchObject(expectedResult);
        })
    
        it('should return null when no timeout is found', async () => {
            const {query, timeoutDB} = setupMock([]);

            const memberID = '101';
            const guildID = '9999';
            
            let result: Timeout = await timeoutDB.getTimeoutForMemberByGuild(memberID, guildID);
    
            expect(query).toBeCalled();
            expect(result).toBeFalsy();
        })
    });

    describe('Get Timeouts For All Guilds', () => {

        it('should not return any timeouts when no guilds have timeouts', async () => {
            const endDate = new Date();
            endDate.setMinutes(today.getMinutes() + 1);
            const {query, timeoutDB} = setupMock([]);
    
            const expectedResult = [];
    
            let result: AbstractGuild[] = await timeoutDB.getTimeoutsForAllGuilds();
    
            expect(query).toBeCalled();
            expect(result).toMatchObject(expectedResult);
        })

        it('should return timeouts for one guild', async () => {
            const endDate = new Date();
            endDate.setMinutes(today.getMinutes() + 1);
            const {query, timeoutDB} = setupMock(
                [
                    {
                        MEMBER_ID: '100',
                        GUILD_ID: '9999',
                        DURATION: '15s',
                        END_DATE: endDate
                    },
                    {
                        MEMBER_ID: '99',
                        GUILD_ID: '9999',
                        DURATION: '15s',
                        END_DATE: endDate
                    }
                ]
            );
    
            const expectedResult = [{
                id: '9999',
                timeouts: [
                    {
                        memberID: '100',
                        guild: {
                            id: '9999',
                        },
                        duration: 15000,
                        durationString: '15s',
                        endDate: endDate
                    },
                    {
                        memberID: '99',
                        guild: {
                            id: '9999',
                        },
                        duration: 15000,
                        durationString: '15s',
                        endDate: endDate
                    }
                ]
            }]  
    
            let result: AbstractGuild[] = await timeoutDB.getTimeoutsForAllGuilds();
    
            expect(query).toBeCalled();
            expect(result).toMatchObject(expectedResult);
        })
    
        it('should return timeouts for multiple guilds', async () => {
            const endDate = new Date();
            endDate.setMinutes(today.getMinutes() + 1);
            const {query, timeoutDB} = setupMock(
                [
                    {
                        MEMBER_ID: '100',
                        GUILD_ID: '9999',
                        DURATION: '15s',
                        END_DATE: endDate
                    },
                    {
                        MEMBER_ID: '99',
                        GUILD_ID: '9999',
                        DURATION: '15s',
                        END_DATE: endDate
                    },
                    {
                        MEMBER_ID: '98',
                        GUILD_ID: '8888',
                        DURATION: '15s',
                        END_DATE: endDate
                    },
                    {
                        MEMBER_ID: '97',
                        GUILD_ID: '7777',
                        DURATION: '15s',
                        END_DATE: endDate
                    }
                ]
            );
    
            const expectedResult = [
                {
                    id: '9999',
                    timeouts: [
                        {
                            memberID: '100',
                            guild: {
                                id: '9999'
                            },
                            duration: 15000,
                            durationString: '15s',
                            endDate: endDate
                        },
                        {
                            memberID: '99',
                            guild: {
                                id: '9999'
                            },
                            duration: 15000,
                            durationString: '15s',
                            endDate: endDate
                        }
                    ]
                },
                {
                    id: '8888',
                    timeouts: [
                        {
                            memberID: '98',
                            guild: {
                                id: '8888',
                            },
                            duration: 15000,
                            durationString: '15s',
                            endDate: endDate
                        }
                    ]
                },
                {
                    id: '7777',
                    timeouts: [
                        {
                            memberID: '97',
                            guild: {
                                id: '7777',
                            },
                            duration: 15000,
                            durationString: '15s',
                            endDate: endDate
                        }
                    ]
                }
            ]  
    
            let result: AbstractGuild[] = await timeoutDB.getTimeoutsForAllGuilds();
    
            expect(query).toBeCalled();
            expect(result).toMatchObject(expectedResult);
        })

        it('should return timeouts for multiple guilds, but exclude timeouts that have ended already and remove them from the DB', async () => {
            const endDate = new Date();
            endDate.setMinutes(today.getMinutes() + 1);
            const pastEndDate = new Date();
            pastEndDate.setMinutes(today.getMinutes() - 1);

            const {query, timeoutDB} = setupMock(
                [
                    {
                        MEMBER_ID: '100',
                        GUILD_ID: '9999',
                        DURATION: '15s',
                        END_DATE: endDate
                    },
                    {
                        MEMBER_ID: '99',
                        GUILD_ID: '9999',
                        DURATION: '15s',
                        END_DATE: pastEndDate
                    },
                    {
                        MEMBER_ID: '98',
                        GUILD_ID: '8888',
                        DURATION: '15s',
                        END_DATE: endDate
                    },
                    {
                        MEMBER_ID: '97',
                        GUILD_ID: '7777',
                        DURATION: '15s',
                        END_DATE: pastEndDate
                    }
                ]
            );
    
            const expectedResult = [
                {
                    id: '9999',
                    timeouts: [
                        {
                            memberID: '100',
                            guild: {
                                id: '9999'
                            },
                            duration: 15000,
                            durationString: '15s',
                            endDate: endDate
                        }
                    ]
                },
                {
                    id: '8888',
                    timeouts: [
                        {
                            memberID: '98',
                            guild: {
                                id: '8888'
                            },
                            duration: 15000,
                            durationString: '15s',
                            endDate: endDate
                        }
                    ]
                }
            ]  
    
            let result: AbstractGuild[] = await timeoutDB.getTimeoutsForAllGuilds();
    
            expect(query).toBeCalledTimes(3);
            expect(query).toHaveBeenNthCalledWith(2, queries.REMOVE_TIMEOUT, ['99', '9999'])
            expect(query).toHaveBeenNthCalledWith(3, queries.REMOVE_TIMEOUT, ['97', '7777'])
            expect(result).toMatchObject(expectedResult);
        })
    });

    

    
});
