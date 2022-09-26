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
export class GroupListConfiguration {
    loadingIconURL: string = "assets/resources/Spinner.svg";
    searchKeyword: string = "";
    joinedOnly: boolean = false;
    hideError: boolean = false
    limit: number = 30;
    tags: string[] = [];
    customView:any =null;
    dataItemConfiguration:DataItemConfiguration = new DataItemConfiguration({})
    constructor(
        {
            loadingIconURL = "assets/resources/Spinner.svg",
            searchKeyword = "",
            joinedOnly = false,
            hideError = false,
            limit = 30,
            tags = [],
            dataItemConfiguration = new DataItemConfiguration({}),
            customView =null
        }
    ) {
        this.loadingIconURL = loadingIconURL;
        this.searchKeyword = searchKeyword;
        this.joinedOnly = joinedOnly;
        this.hideError = hideError;
        this.limit = limit;
        this.tags = tags;
        this.customView =customView;
        this.dataItemConfiguration=dataItemConfiguration;

    }

}
