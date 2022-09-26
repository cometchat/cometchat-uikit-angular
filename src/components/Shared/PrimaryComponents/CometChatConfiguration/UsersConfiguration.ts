import { UserListConfiguration } from "./UserListConfiguration";

/**
 * @class UsersConfiguration
 * @param {string} searchPlaceholder
 * @param {string} searchIconURL
 * @param {boolean} hideSearch
 * @param {string} backButtonIconURL
 * @param {boolean} showBackButton
 */
 export class UsersConfiguration {
	searchPlaceholder:string = "assets/resources/Spinner.svg";
    searchIconURL:string = "assets/resources/search.svg";
    backButtonIconURL:string = "assets/resources/backbutton.svg";
    hideSearch:boolean = true;
    showBackButton:boolean = false;
    userListConfiguration:UserListConfiguration = new UserListConfiguration ({})
	constructor(
		{
            searchPlaceholder = "Search",
            searchIconURL = "assets/resources/search.svg",
            backButtonIconURL = "assets/resources/backbutton.svg",
            hideSearch = false,
            showBackButton = false,
            userListConfiguration =  new UserListConfiguration ({})
		}
	) {
        this.searchPlaceholder = searchPlaceholder
            this.searchIconURL = searchIconURL
            this.backButtonIconURL = backButtonIconURL
            this.hideSearch = hideSearch
            this.showBackButton = showBackButton
            this.userListConfiguration=userListConfiguration

	}

}
