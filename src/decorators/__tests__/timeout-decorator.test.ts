import 'isomorphic-fetch';

import { TimeoutPreCondition } from "../timeout-decorator";
import { timeoutDB } from "../../command-helper/moderation/timeout/timeout-db";
import { MEMBER_ALREADY_TIMED_OUT, MEMBER_HAS_NOT_BEEN_TIMED_OUT_YET } from "../../constants/bot-responses";


class TestStartTimeout {
    @TimeoutPreCondition('START TIMEOUT')
    method(message, { member }) {
        return 'done'
    }
}

class TestEndTimeout {
    @TimeoutPreCondition('END TIMEOUT')
    method(message, { member }) {
        return 'done'
    }
}

jest.mock('../../command-helper/moderation/timeout/timeout-db');

const ownerID = '1337';
const guildID = '9999';
const messageOwnerMemberID = '100';
const targetMemberID = '70';
const clientID = '0000';

describe('TimeoutPrecondition Decorator', () => {

    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    }); 

    it('should not let a timeout be applied on member when one is already active', async () => {
        const getTimeoutForMemberByGuildSpy = jest.spyOn(timeoutDB, 'getTimeoutForMemberByGuild');
        getTimeoutForMemberByGuildSpy.mockImplementation(() => {
            return Promise.resolve({
                memberID: messageOwnerMemberID,
                guild: null,
                durationString: '15s' ,
                duration: 15000,
                endDate: new Date()
            })
        });

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: messageOwnerMemberID
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: targetMemberID
            }
        }

        let result = await new TestStartTimeout().method(message, input);

        expect(getTimeoutForMemberByGuildSpy).toHaveBeenCalledWith(targetMemberID, guildID);
        expect(result).toEqual(MEMBER_ALREADY_TIMED_OUT);
    });

    it('should apply timeout to member when member does not already have a timeout', async () => {
        const getTimeoutForMemberByGuildSpy = jest.spyOn(timeoutDB, 'getTimeoutForMemberByGuild');
        getTimeoutForMemberByGuildSpy.mockImplementation(() => Promise.resolve(null));

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: messageOwnerMemberID
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: targetMemberID
            }
        }

        let result = await new TestStartTimeout().method(message, input);

        expect(getTimeoutForMemberByGuildSpy).toHaveBeenCalledWith(targetMemberID, guildID);
        expect(result).toEqual('done');
    });

    it('should not attempt to remove timeout from member when they do not have an active timeout', async () => {
        const getTimeoutForMemberByGuildSpy = jest.spyOn(timeoutDB, 'getTimeoutForMemberByGuild');
        getTimeoutForMemberByGuildSpy.mockImplementation(() => Promise.resolve(null));

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: messageOwnerMemberID
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: targetMemberID
            }
        }

        let result = await new TestEndTimeout().method(message, input);

        expect(getTimeoutForMemberByGuildSpy).toHaveBeenCalledWith(targetMemberID, guildID);
        expect(result).toEqual(MEMBER_HAS_NOT_BEEN_TIMED_OUT_YET);
    });

    it('should end timeout for member when they have an active timeout', async () => {
        const getTimeoutForMemberByGuildSpy = jest.spyOn(timeoutDB, 'getTimeoutForMemberByGuild');
        getTimeoutForMemberByGuildSpy.mockImplementation(() => {
            return Promise.resolve({
                memberID: messageOwnerMemberID,
                guild: null,
                durationString: '15s' ,
                duration: 15000,
                endDate: new Date()
            })
        });

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: messageOwnerMemberID
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: targetMemberID
            }
        }

        let result = await new TestEndTimeout().method(message, input);

        expect(getTimeoutForMemberByGuildSpy).toHaveBeenCalledWith(targetMemberID, guildID);
        expect(result).toEqual('done');
    });

    
});
