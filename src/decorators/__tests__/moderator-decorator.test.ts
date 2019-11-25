import 'isomorphic-fetch';
import { Permissions } from "discord.js";

import { Moderator } from "../moderation-decorator";
import * as guild from "../../discord/guild";
import { CAN_NOT_MODERATE_SELF, CAN_NOT_MODERATE_OWNER, MISSING_MANAGE_CHANNEL_AND_ROLES_PERMISSIONS, CAN_NOT_MODERATE_ADMINISTRATOR, CAN_NOT_MODERATE_OTHER_MODS, CAN_NOT_MODERATE_BOTS } from "../../constants/bot-responses";

interface Input {
    member: any
}

class Test {
    @Moderator()
    method(message, input?: Input) {
        return 'done'
    }
}

jest.mock("../../discord/guild");

const ownerID = '1337';
const guildID = '100';
const clientID = '0000'

describe('Moderator Decorator', () => {

    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    }); 

    it('should not respond if message owner does not have ban/kick permissions', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy.mockImplementation(() => false);

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: '70'
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenCalledWith(message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(result).toEqual(undefined);
    });

    it('should not let you moderate yourself', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy.mockImplementation(() => true);

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: '50'
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenCalledWith(message.guild.id, input.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(result).toEqual(CAN_NOT_MODERATE_SELF)
    });    
      
    it('should not let you moderate the owner of the guild', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy.mockImplementation(() => true);

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: ownerID
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenCalledWith(message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(result).toEqual(CAN_NOT_MODERATE_OWNER)
    });

    it('should not perform moderation action without MANAGE_CHANNELS/MANAGE_ROLES permissions', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy
            .mockImplementationOnce(() => true)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false);

        const getClientIDSpy = jest.spyOn(guild, 'getClientID');
        getClientIDSpy.mockImplementation(() => clientID)

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: '70'
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(1, message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(2, message.guild.id, input.member.id, [Permissions.FLAGS.ADMINISTRATOR]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(3, message.guild.id, input.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(4, message.guild.id, clientID, [Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_ROLES]);
        expect(result).toEqual(MISSING_MANAGE_CHANNEL_AND_ROLES_PERMISSIONS)
    });

    it('should not let you moderate an administrator', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy
            .mockImplementationOnce(() => true)
            .mockImplementationOnce(() => true);

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: '70'
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(1, message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(2, message.guild.id, input.member.id, [Permissions.FLAGS.ADMINISTRATOR]);
        expect(result).toEqual(CAN_NOT_MODERATE_ADMINISTRATOR)
    });

    it('should not moderate another member with KICK/BAN permissions', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => false)
        .mockImplementationOnce(() => true);

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: '70'                
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(1, message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(2, message.guild.id, input.member.id, [Permissions.FLAGS.ADMINISTRATOR]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(3, message.guild.id, input.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(result).toEqual(CAN_NOT_MODERATE_OTHER_MODS);
    });

    it('should not let you moderate a bot', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy
            .mockImplementationOnce(() => true)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => true);

        const getClientIDSpy = jest.spyOn(guild, 'getClientID');
        getClientIDSpy.mockImplementation(() => clientID)

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: '70',
                user: {
                    bot: true
                }
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(1, message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(2, message.guild.id, input.member.id, [Permissions.FLAGS.ADMINISTRATOR]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(3, message.guild.id, input.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(4, message.guild.id, clientID, [Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_ROLES]);

        expect(result).toEqual(CAN_NOT_MODERATE_BOTS); 
    });

    it('should go through entire function successfully when all moderation checks pass', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy
            .mockImplementationOnce(() => true)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => false)
            .mockImplementationOnce(() => true);

        const getClientIDSpy = jest.spyOn(guild, 'getClientID');
        getClientIDSpy.mockImplementation(() => clientID)

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        let input = {
            member: {
                id: '70',
                user: {
                    bot: false
                }
            }
        }
        let result = new Test().method(message, input);

        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(1, message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(2, message.guild.id, input.member.id, [Permissions.FLAGS.ADMINISTRATOR]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(3, message.guild.id, input.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(4, message.guild.id, clientID, [Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_ROLES]);
        expect(result).toEqual('done')
    });

    it('should go through entire function successfully when all moderation checks pass and there is no target member', () => {
        const hasPermissionsInGuildSpy = jest.spyOn(guild, 'hasPermissionsInGuild');
        hasPermissionsInGuildSpy
            .mockImplementationOnce(() => true)
            .mockImplementationOnce(() => true)
            .mockImplementationOnce(() => true)
            .mockImplementationOnce(() => true);

        const getClientIDSpy = jest.spyOn(guild, 'getClientID');
        getClientIDSpy.mockImplementation(() => clientID)

        let message = {
            guild: {
                id: guildID,
                owner: {
                    id: ownerID
                }
            },
            member: {
                id: '50'
            },
            say: (message) => message
        }

        
        let result = new Test().method(message);

        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(1, message.guild.id, message.member.id, [Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
        expect(hasPermissionsInGuildSpy).toHaveBeenNthCalledWith(2, message.guild.id, clientID, [Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_ROLES]);
        expect(result).toEqual('done')
    });

    
});
