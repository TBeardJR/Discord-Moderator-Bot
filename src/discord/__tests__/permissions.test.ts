import 'isomorphic-fetch';
import { Permissions } from "discord.js";

import * as guild from "../guild";
import { overwritePermissionsForEachChannelForMember, restorePermissionOverwritesForEachChannelForMember } from "../permissions";
import { ChannelPermissions } from "../../types/types";
import { AbstractDatabase } from "../../types/abstract-db";


jest.mock('../guild')

const clientID = '1337';
const guildID = '9999';
const memberID = '100';

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

describe("Guild/Channel Permissions", () => {

    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    }); 

    describe('Overwrite Permissions For Each Channel For Member', () => {
        it('should return empty Channel Permissions object when the bot has no edit permissions access for any channel in guild', async () => {
            let channels: any[] = [
                {
                    id: '10',
    
                },
                {
                    id: '11',
                    
                }
            ]
    
            let permissionsObject = {}
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => false);
    
            let channelPermissions: ChannelPermissions[] = await overwritePermissionsForEachChannelForMember(memberID, clientID, guildID, permissionsObject)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channelPermissions.length).toBe(0);
        })
    
        it('should return empty Channel Permissions object when bot has edit permissions access for channels, but the member has no pre existing permission overwrites for channels', async () => {
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => null)
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => null)
                    },
                    overwritePermissions: jest.fn()
    
                }
            ]
    
            let permissionsObject = {}
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            let channelPermissions: ChannelPermissions[] = await overwritePermissionsForEachChannelForMember(memberID, clientID, guildID, permissionsObject)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[1].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[0].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            expect(channels[1].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            expect(channelPermissions.length).toBe(0);
        })
    
        it('should return correct Channel Permissions object when bot has edit permissions access for channels, and the member has pre existing ALLOWED permission overwrites for channels', async () => {
            let currentPermissions = {
                allowed: {
                    serialize: () => {return {SEND_MESSAGES: true, CONNECT: true}}
                },
                denied: {
                    serialize: () => {return {SEND_MESSAGES: false, CONNECT: false}}
                }
            }
            
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                }
            ]
    
            
    
            let permissionsObject = {SEND_MESSAGES: false, CONNECT: false}
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            let channelPermissions: ChannelPermissions[] = await overwritePermissionsForEachChannelForMember(memberID, clientID, guildID, permissionsObject)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[1].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[0].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            expect(channels[1].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            
            expect(channelPermissions.length).toBe(2);
            expect(channelPermissions[0]).toEqual({guildID, guildChannelID: channels[0].id, memberID, permissions: '{"SEND_MESSAGES":true,"CONNECT":true}'})
            expect(channelPermissions[1]).toEqual({guildID, guildChannelID: channels[1].id, memberID, permissions: '{"SEND_MESSAGES":true,"CONNECT":true}'})
            
        })
    
        it('should return correct Channel Permissions object when bot has edit permissions access for channels, and the member has pre existing UNSET permission overwrites for channels', async () => {
            let currentPermissions = {
                allowed: {
                    serialize: () => {return {SEND_MESSAGES: false, CONNECT: false}}
                },
                denied: {
                    serialize: () => {return {SEND_MESSAGES: false, CONNECT: false}}
                }
            }
            
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                }
            ]
    
            
    
            let permissionsObject = {SEND_MESSAGES: false, CONNECT: false}
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            let channelPermissions: ChannelPermissions[] = await overwritePermissionsForEachChannelForMember(memberID, clientID, guildID, permissionsObject)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[1].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[0].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            expect(channels[1].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            
            expect(channelPermissions.length).toBe(2);
            expect(channelPermissions[0]).toEqual({guildID, guildChannelID: channels[0].id, memberID, permissions: '{"SEND_MESSAGES":null,"CONNECT":null}'})
            expect(channelPermissions[1]).toEqual({guildID, guildChannelID: channels[1].id, memberID, permissions: '{"SEND_MESSAGES":null,"CONNECT":null}'})
            
        })
    
        it('should return correct Channel Permissions object when bot has edit permissions access for channels, and the member has pre existing DENIED permission overwrites for channels', async () => {
            let currentPermissions = {
                allowed: {
                    serialize: () => {return {SEND_MESSAGES: false, CONNECT: false}}
                },
                denied: {
                    serialize: () => {return {SEND_MESSAGES: true, CONNECT: true}}
                }
            }
            
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                }
            ]
    
            
    
            let permissionsObject = {SEND_MESSAGES: false, CONNECT: false}
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            let channelPermissions: ChannelPermissions[] = await overwritePermissionsForEachChannelForMember(memberID, clientID, guildID, permissionsObject)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[1].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[0].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            expect(channels[1].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            
            expect(channelPermissions.length).toBe(2);
            expect(channelPermissions[0]).toEqual({guildID, guildChannelID: channels[0].id, memberID, permissions: '{"SEND_MESSAGES":false,"CONNECT":false}'})
            expect(channelPermissions[1]).toEqual({guildID, guildChannelID: channels[1].id, memberID, permissions: '{"SEND_MESSAGES":false,"CONNECT":false}'})
            
        })
    
        it('should return correct Channel Permissions object when bot has edit permissions access for channels, and the member has pre existing ALLOWED AND DENIED permissions overwrites for channels', async () => {
            let currentPermissions = {
                allowed: {
                    serialize: () => {return {SEND_MESSAGES: true, CONNECT: false}}
                },
                denied: {
                    serialize: () => {return {SEND_MESSAGES: false, CONNECT: true}}
                }
            }
            
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: jest.fn().mockImplementation(() => currentPermissions)
                    },
                    overwritePermissions: jest.fn()
    
                }
            ]
    
            
    
            let permissionsObject = {SEND_MESSAGES: false, CONNECT: false}
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            let channelPermissions: ChannelPermissions[] = await overwritePermissionsForEachChannelForMember(memberID, clientID, guildID, permissionsObject)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[1].permissionOverwrites.get).toHaveBeenCalledWith(memberID);
            expect(channels[0].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            expect(channels[1].overwritePermissions).toHaveBeenCalledWith(memberID, permissionsObject);
            
            expect(channelPermissions.length).toBe(2);
            expect(channelPermissions[0]).toEqual({guildID, guildChannelID: channels[0].id, memberID, permissions: '{"SEND_MESSAGES":true,"CONNECT":false}'})
            expect(channelPermissions[1]).toEqual({guildID, guildChannelID: channels[1].id, memberID, permissions: '{"SEND_MESSAGES":true,"CONNECT":false}'})
            
        })
    });

    describe('Restore Permissions Overwrites For Each Channel For Member', () => {

        it('should not attempt to overwrite permissions when the bot has no edit permissions access for any channel in guild', async () => {
            let deleteFunc = jest.fn();
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
                    
                }
            ]
    
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => false);

            const isUserStillInGuildSpy = jest.spyOn(guild, 'isUserStillInGuild');
            isUserStillInGuildSpy.mockImplementation(() => Promise.resolve(true));

            database.getAllChannelPermissionsForMemberInGuild = () => Promise.resolve(new Map<string, ChannelPermissions>());
    
            await restorePermissionOverwritesForEachChannelForMember(memberID, clientID, guildID, database)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(deleteFunc).not.toHaveBeenCalled();
            expect(channels[0].overwritePermissions).not.toHaveBeenCalled();
            expect(channels[1].overwritePermissions).not.toHaveBeenCalled();
            expect(database.removeAllChannelPermissionsForMember).toHaveBeenCalled();
        }); 
        
        it('should attempt to overwrite permissions prexisting permissions are fetched from DB', async () => {
            let deleteFunc = jest.fn();
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
                    
                }
            ]
    
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            const isUserStillInGuildSpy = jest.spyOn(guild, 'isUserStillInGuild');
            isUserStillInGuildSpy.mockImplementation(() => Promise.resolve(true));
    
            let channelPermissionsList: ChannelPermissions[] = [
                {guildID, guildChannelID: channels[0].id, memberID, permissions: '{"SEND_MESSAGES":true,"CONNECT":false}'},
                {guildID, guildChannelID: channels[1].id, memberID, permissions: '{"SEND_MESSAGES":true,"CONNECT":false}'}
            ];
    
            let channelPermissionsMap: Map<string, ChannelPermissions> = new Map();
            channelPermissionsMap.set(channels[0].id, channelPermissionsList[0])
            channelPermissionsMap.set(channels[1].id, channelPermissionsList[1])
    
            database.getAllChannelPermissionsForMemberInGuild = () => Promise.resolve(channelPermissionsMap);
    
            await restorePermissionOverwritesForEachChannelForMember(memberID, clientID, guildID, database)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].overwritePermissions).toHaveBeenCalledWith(memberID, {SEND_MESSAGES: true, CONNECT: false});
            expect(channels[1].overwritePermissions).toHaveBeenCalledWith(memberID, {SEND_MESSAGES: true, CONNECT: false});
            expect(database.removeAllChannelPermissionsForMember).toHaveBeenCalled();
        }) 

        it('should not attempt to overwrite channel permissions when prexisting permissions are not fetched from DB, but should delete them instead', async () => {
            let deleteFunc = jest.fn();
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
                    
                }
            ]
    
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            const isUserStillInGuildSpy = jest.spyOn(guild, 'isUserStillInGuild');
            isUserStillInGuildSpy.mockImplementation(() => Promise.resolve(true));
    
          
    
            database.getAllChannelPermissionsForMemberInGuild = () => Promise.resolve(null);
    
            await restorePermissionOverwritesForEachChannelForMember(memberID, clientID, guildID, database)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].overwritePermissions).not.toHaveBeenCalled();
            expect(channels[1].overwritePermissions).not.toHaveBeenCalled();
            expect(deleteFunc).toHaveBeenCalledTimes(2);
            expect(database.removeAllChannelPermissionsForMember).toHaveBeenCalled();
        }) 

        it('should attempt to delete member specific channel permission override when no prexisting permissions are fetched from DB', async () => {
            let deleteFunc = jest.fn();
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
                    
                }
            ]
    
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => true);
    
            const isUserStillInGuildSpy = jest.spyOn(guild, 'isUserStillInGuild');
            isUserStillInGuildSpy.mockImplementation(() => Promise.resolve(true));
    
            let channelPermissionsMap: Map<string, ChannelPermissions> = new Map();
    
            database.getAllChannelPermissionsForMemberInGuild = () => Promise.resolve(channelPermissionsMap);
    
            await restorePermissionOverwritesForEachChannelForMember(memberID, clientID, guildID, database)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).toHaveBeenCalledWith(guildID);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(1, guildID, clientID, channels[0].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(hasPermissionsInChannelSpy).toHaveBeenNthCalledWith(2, guildID, clientID, channels[1].id, [Permissions.FLAGS.MANAGE_ROLES_OR_PERMISSIONS]);
            expect(channels[0].overwritePermissions).not.toHaveBeenCalled();
            expect(channels[1].overwritePermissions).not.toHaveBeenCalled();
            expect(deleteFunc).toHaveBeenCalledTimes(2);

            expect(database.removeAllChannelPermissionsForMember).toHaveBeenCalled();
        }) 

        it('should not attempt to overwrite permissions or delete channel permission overrides when user is no longer in guild', async () => {
            let deleteFunc = jest.fn();
            let channels: any[] = [
                {
                    id: '10',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
    
                },
                {
                    id: '11',
                    permissionOverwrites: {
                        get: () => {
                            return {
                                delete: deleteFunc
                            }
                        }
                    },
                    overwritePermissions: jest.fn()
                    
                }
            ]
    
            const getArrayOfNonCategoryChannelsForGuildSpy = jest.spyOn(guild, 'getArrayOfNonCategoryChannelsForGuild');
            getArrayOfNonCategoryChannelsForGuildSpy.mockImplementation(() => channels);
    
            const hasPermissionsInChannelSpy = jest.spyOn(guild, 'hasPermissionsInChannel');
            hasPermissionsInChannelSpy.mockImplementation(() => false);

            const isUserStillInGuildSpy = jest.spyOn(guild, 'isUserStillInGuild');
            isUserStillInGuildSpy.mockImplementation(() => Promise.resolve(false));

            database.getAllChannelPermissionsForMemberInGuild = () => Promise.resolve(new Map<string, ChannelPermissions>());
    
            await restorePermissionOverwritesForEachChannelForMember(memberID, clientID, guildID, database)
    
            expect(getArrayOfNonCategoryChannelsForGuildSpy).not.toHaveBeenCalled();
            expect(hasPermissionsInChannelSpy).not.toHaveBeenCalled();
            expect(deleteFunc).not.toHaveBeenCalled();
            expect(channels[0].overwritePermissions).not.toHaveBeenCalled();
            expect(channels[1].overwritePermissions).not.toHaveBeenCalled();
            expect(database.removeAllChannelPermissionsForMember).toHaveBeenCalled();
        }) 
    }) 
});
