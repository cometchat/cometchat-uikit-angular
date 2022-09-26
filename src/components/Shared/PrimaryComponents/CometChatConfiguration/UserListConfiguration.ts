import { DataItemConfiguration } from "./DataItemConfiguration";

/**
 * @class UserListConfiguration
 * @param {number} limit
 * @param {string} searchKeyword
 * @param {string} status
 * @param {boolean} friendsOnly
 * @param {boolean} hideBlockedUsers
 * @param {[]string} roles
 * @param {[]string} tags
  * @param {[]string} uids
 * @param {string} loadingIconURL
 * @param {boolean} hideError
 * @param {any} customView
 */
 export class UserListConfiguration {
	loadingIconURL:string = "assets/resources/Spinner.svg";
    searchKeyword:string = "";
    status:string = "";
    friendsOnly:boolean = false;
    hideBlockedUsers:boolean = true;
    roles:string[] = [];
    uids: string[] = [];
    hideError:boolean = false
    customView = null;
	limit:number = 30;
	tags:string[] = [];
    dataItemConfiguration:DataItemConfiguration = new DataItemConfiguration({})
	constructor(
		{
            loadingIconURL = "assets/resources/Spinner.svg",
            searchKeyword = "",
            status = "",
            friendsOnly = false,
            hideBlockedUsers = true,
            roles = [],
            uids = [],
            hideError = false,
            limit = 30,
            tags = [],
            dataItemConfiguration = new DataItemConfiguration({}),
            customView = null
		}
	) {
        this.loadingIconURL = loadingIconURL;
        this.searchKeyword = searchKeyword;
        this.status = status;
       this.friendsOnly = friendsOnly;
        this.hideBlockedUsers = hideBlockedUsers;
        this.roles = roles;
        this.uids = uids;
       this.hideError = hideError;
       this.limit = limit;
       this.tags = tags;
       this.dataItemConfiguration = dataItemConfiguration;
       this.customView = customView;

	}

}
