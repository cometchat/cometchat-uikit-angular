import {
	MessagesConfiguration
} from "./";

import {GroupsConfiguration} from './GroupsConfiguratio'
/**
 * @class UsersWithMessagesConfiguration
 * @param {Boolean} isMobile
 * @param {Object} groupsConfiguration
 * @param {Object} messagesConfiguration
 */
export class GroupsWithMessagesConfiguration {
	isMobile = false
	groupsConfiguration = new GroupsConfiguration({})
	messagesConfiguration = new MessagesConfiguration({})
	constructor(
		{
			isMobile = false,
			groupsConfiguration = new GroupsConfiguration({}),
			messagesConfiguration = new MessagesConfiguration({}),
		}
	) {
		this.isMobile = isMobile;
		this.groupsConfiguration = groupsConfiguration;
		this.messagesConfiguration = messagesConfiguration;
	}
}

