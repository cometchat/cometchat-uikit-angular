import { CreateGroupConfiguration } from "./createGroupCOnfiguration";
import { GroupListConfiguration } from "./GroupListConfiguration";
import { PopoverConfiguration } from "./PopoverConfiguration";

/**
 * @class UsersConfiguration
 * @param {string} searchPlaceholder
 * @param {string} searchIconURL
 * @param {boolean} hideSearch
 * @param {string} backButtonIconURL
 * @param {boolean} showBackButton
 */
 export class GroupsConfiguration {
	searchPlaceholder:string = "Search";
    searchIconURL:string = "assets/resources/search.svg";
    backButtonIconURL:string = "assets/resources/backbutton.svg";
    hideSearch:boolean = true;
    hideCreateGroup:boolean = true;
    createGroupIconURL:string="assets/resources/create-button.svg"
    showBackButton:boolean = false;
    createGroupConfiguration: CreateGroupConfiguration = new CreateGroupConfiguration({})
    popoverConfiguration:PopoverConfiguration = new PopoverConfiguration({})
    groupListConfiguration:GroupListConfiguration = new GroupListConfiguration({})
	constructor(
		{
            searchPlaceholder = "Search",
            searchIconURL = "assets/resources/search.svg",
            backButtonIconURL = "assets/resources/backbutton.svg",
            hideSearch = false,
            showBackButton = false,
            hideCreateGroup = false,
            createGroupIconURL ="assets/resources/create-button.svg",
            createGroupConfiguration= new CreateGroupConfiguration({}),
            popoverConfiguration=new PopoverConfiguration({}),
            groupListConfiguration=new GroupListConfiguration({})
		}
	) {
        this.searchPlaceholder = searchPlaceholder
            this.searchIconURL = searchIconURL
            this.backButtonIconURL = backButtonIconURL
            this.hideSearch = hideSearch
            this.showBackButton = showBackButton
            this.hideCreateGroup = hideCreateGroup
            this.createGroupIconURL =createGroupIconURL
            this.createGroupConfiguration = createGroupConfiguration
            this.popoverConfiguration=popoverConfiguration
            this.groupListConfiguration=groupListConfiguration

	}

}
