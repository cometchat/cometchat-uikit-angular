import {
	MessagesConfiguration
} from "./";

import {UsersConfiguration} from './usersConfiguration'
/**
 * @class UsersWithMessagesConfiguration
 * @param {Boolean} isMobile
 * @param {Object} usersConfiguration
 * @param {Object} messagesConfiguration
 */
export class UsersWithMessagesConfiguration {
	isMobile = false
	usersConfiguration = new UsersConfiguration({})
	messagesConfiguration = new MessagesConfiguration({})
	constructor(
		{
			isMobile = false,
			usersConfiguration = new UsersConfiguration({}),
			messagesConfiguration = new MessagesConfiguration({}),
		}
	) {
		this.isMobile = isMobile;
		this.usersConfiguration = usersConfiguration;
		this.messagesConfiguration = messagesConfiguration;
	}
}

