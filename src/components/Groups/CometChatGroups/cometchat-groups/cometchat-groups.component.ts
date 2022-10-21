import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CometChatTheme, fontHelper, localize } from "../../../Shared";

import { CometChat } from "@cometchat-pro/chat";
import { styles } from "../interface";
import { groupListStyle } from "../../CometChatGroupList/interface"
import { GroupListConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/GroupListConfiguration";
import { checkHasOwnProperty } from "../../../Shared/Helpers/CometChatHelper";
import { CometChatGroupListComponent } from "../../CometChatGroupList/cometchat-group-list/cometchat-group-list.component";
import { CometChatGroupEvents } from "../../CometChatGroupEvents.service";
import { CreateGroupConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/createGroupCOnfiguration";
import { GroupsConstants } from "../../../Shared/Constants/UIKitConstants";
import { popoverStyles } from "../../../Shared/UtilityComponents/CometChatPopover/interface";
import { createGroupStyle } from "../../CometChatCreateGroup/interface";
import { PopoverConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/PopoverConfiguration";
/**
*
* CometChatGroups is a wrapper component which consists of CometChatListBaseComponent and CometChatGroupListComponent.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-groups",
  templateUrl: "./cometchat-groups.component.html",
  styleUrls: ["./cometchat-groups.component.scss"],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CometChatGroupsComponent implements OnInit, OnChanges {
  /**
  * This properties will come from Parent.
  */
  @ViewChild("groupListRef", { static: false }) groupListRef!: CometChatGroupListComponent;
  @Input() title: string = localize("GROUPS");
  @Input() searchPlaceholder: string = localize("SEARCH");
  @Input() activeGroup: CometChat.Group | null = null;
  @Input() style: styles = {
    width: "100%",
    height: "100%",
    background: "white",
    border: "none",
    borderRadius: "",
    titleFont: "700 22px Inter",
    titleColor: "black",
    backIconTint: "grey",
    searchBorder: "none",
    searchBorderRadius: "8px",
    searchBackground: "rgba(20, 20, 20, 0.04)",
    searchTextFont: "400 15px Inter",
    searchTextColor: "grey",
    searchIconTint: "grey",
    createGroupIconTint: "rgb(51, 153, 255)"
  };

  @Input() backButtonIconURL: string = "assets/resources/backbutton.svg";
  @Input() createGroupIconURL: string = "assets/resources/create-button.svg"
  @Input() hideCreateGroup: boolean = false;
  @Input() searchIconURL: string = "assets/resources/search.svg";
  @Input() showBackButton: boolean = false;
  @Input() hideSearch: boolean = true;
  @Input() groupListConfiguration: GroupListConfiguration = new GroupListConfiguration({});
  @Input() createGroupConfiguration: CreateGroupConfiguration = new CreateGroupConfiguration({});
  @Input() popoverConfiguration: PopoverConfiguration = new PopoverConfiguration({});
  /**
  * Properties for internal use
  */
  public openCreateGroup: boolean = false;
  popOverStyle:popoverStyles={
    width:"360px",
    height:"620px",
    border:"none",
    background:"white",
    borderRadius:"8px", 
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
    top:"50%",
    left:"50%",
    transform:"translate(-50%,-50%)",
    position:"fixed",
  }
  createGroupStyle:createGroupStyle = {
    width: "100%",
    height: "100%",
    background: "rgb(255, 255, 255)",
    border: "none",
    borderRadius: "8px",
    boxShadow:"rgba(20, 20, 20, 0.2) 0px 16px 32px 0px",
    groupTypeTextFont: "500 13px Inter",
    groupTypeBorder:"1px solid rgb(178 178 178 / 60%)",
    groupTypeTextColor: "black",
    groupTypeTextBackground:"transparent",
    groupTypeBackground:"rgba(20, 20, 20, 0.08)",
    groupTypeTextActiveBackground:"rgb(255, 255, 255)",
    groupTypeTextActiveBoxShadow:"rgba(20, 20, 20, 0.12) 0 3px 8px 0",
    groupTypeTextActiveBorderRadius:"8px",
    groupTypeTextBoxShadow:"none",
    groupTypeTextBorderRadius:"0",
    closeIconTint:"rgb(51, 153, 255)",
    titleTextFont: "700 22px Inter",
    titleTextColor: "rgb(20, 20, 20)",
    errorTextFont: "500 15px Inter",
    errorTextBackground:"rgba(255, 59, 48, 0.1)",
    errorTextBorderRadius:"8px",
    errorTextBorder:"none",
    errorTextColor: "rgb(255, 59, 48)",
    namePlaceholderTextFont:"400 15 Inter",
    namePlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
    nameInputBackground:"rgba(20, 20, 20, 0.04)",
    nameTextFont:"400 15 Inter",
    nameTextColor:"rgb(20, 20, 20)",
    nameInputBorder: "none",
    nameInputBorderRadius: "8px",
    nameInputBoxShadow:"rgba(20, 20, 20, 0.04) 0 0 0 1px",
    passwordPlaceholderTextFont:"400 15 Inter",
    passwordPlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
    passwordInputBackground:"rgba(20, 20, 20, 0.04)",
    passwordInputBorder: "none",
    passwordInputBorderRadius: "8px",
    passwordInputBoxShadow:"rgba(20, 20, 20, 0.04) 0 0 0 1px",
    passwordTextFont:"400 15 Inter",
    passwordTextColor:"rgb(20, 20, 20)",
    createGroupButtonTextFont:"600 15px Inter",
    createGroupButtonTextColor:"rgb(255, 255, 255)",
    createGroupButtonBackground:"rgb(51, 153, 255)",
    createGroupButtonBorderRadius:"8px"
    
  }
  public joinedOnly: boolean = false;
  public groupListStyle: groupListStyle = {
    width: "100%",
    height: "100%",
    background: "white",
    border: "",
    borderRadius: "",
    loadingIconTint: "grey",
    emptyStateTextFont: "700 22px Inter",
    emptyStateTextColor: "grey",
    errorStateTextFont: "700 22px Inter",
    errorStateTextColor: "grey",
  }
   @Input() theme: CometChatTheme = new CometChatTheme({});
  public loadingIconURL: string = "assets/resources/wait.svg";
  public searchKeyword: string = "";
  public hideError: boolean = false;
  public limit: number = 30;
  public tags: string[] = [];
  public onClose:any = null;
  public hideCloseButton:any= false;
  public onCreateGroup:any = null;
  public closeButtonIconURL:string="assets/resources/close2x.svg"; 
  public customView:any = null;
  public onGroupCreated:any = null;

  constructor(private groupEvents: CometChatGroupEvents) { }
  ngOnInit() {
    this.subscribeToEvents();
  }
  ngOnChanges(changes: SimpleChanges): void {

    if(changes["popoverConfiguration"] || changes["createGroupConfiguration"] || changes["groupListConfiguration"]){
      this.setGroupListConfig();
      this.setPopoverConfig();
      this.setCreateGroupConfig();
    }

    this.setTheme();
  }
  subscribeToEvents() {
    this.onGroupCreated = this.groupEvents.onGroupCreate.subscribe((group: CometChat.Group) => {
      this.addGroup(group)
    })
  }
  unSubscribeToEvents() {
    this.onGroupCreated.unsubscribe()
  }
  /**
   * @param  {CometChat.Group} group
   */
  addGroup(group: CometChat.Group) {
    this.groupListRef.addGroup(group)
  }
  onCreateClick = () => {
    this.openCreateGroup = !this.openCreateGroup
  }
  setTheme() {
    
    this.style.background = this.theme.palette.getBackground();
    this.style.titleFont = fontHelper(this.theme.typography.title1);
    this.style.titleColor = this.theme.palette.getAccent();
    this.style.searchBackground = this.theme.palette.getAccent50();
    this.style.searchTextColor = this.theme.palette.getAccent();
    this.style.searchIconTint = this.theme.palette.getAccent500();
    this.style.backIconTint = this.theme.palette.getAccent500();
    this.style.searchTextFont = fontHelper(this.theme.typography.subtitle2);
    this.groupListStyle.emptyStateTextFont = fontHelper(this.theme.typography.title1);
    this.groupListStyle.emptyStateTextColor = this.theme.palette.getAccent400();
    this.groupListStyle.background = this.theme.palette.getBackground();
    this.groupListStyle.loadingIconTint = this.theme.palette.getAccent600();
    this.createGroupStyle.boxShadow = `${this.theme.palette.getAccent50()} 0px 0px 0px 1px`;
    this.createGroupStyle.closeIconTint = this.theme.palette.getPrimary();
    this.createGroupStyle.background = this.theme.palette.getBackground();
    this.createGroupStyle.createGroupButtonBackground = this.theme.palette.getPrimary();
    this.createGroupStyle.createGroupButtonTextFont = fontHelper(this.theme.typography.title2)
    this.createGroupStyle.createGroupButtonTextColor = this.theme.palette.getAccent900("light");
    this.createGroupStyle.errorTextBackground = this.theme.palette.getAccent50();
    this.createGroupStyle.errorTextColor = this.theme.palette.getError();
    this.createGroupStyle.errorTextFont = fontHelper(this.theme.typography.text1);
    this.createGroupStyle.groupTypeBackground = this.theme.palette.getAccent100();
    this.createGroupStyle.groupTypeTextActiveBackground = this.theme.palette.getBackground();
    this.createGroupStyle.groupTypeTextActiveBoxShadow =`${this.theme.palette.getAccent100()} 0px 3px 1px 0`;
    this.createGroupStyle.groupTypeTextColor = this.theme.palette.getAccent();
    this.createGroupStyle.groupTypeTextFont = fontHelper(this.theme.typography.text2);
    this.createGroupStyle.nameInputBackground = this.theme.palette.getAccent50();
    this.createGroupStyle.nameInputBoxShadow = `${this.theme.palette.getAccent50()} 0px 0px 0px 1px`;
    this.createGroupStyle.namePlaceholderTextColor = this.theme.palette.getAccent();
    this.createGroupStyle.namePlaceholderTextFont = fontHelper(this.theme.typography.subtitle1);
    this.createGroupStyle.nameTextColor = this.theme.palette.getAccent();
    this.createGroupStyle.nameTextFont = fontHelper(this.theme.typography.subtitle2);
    this.createGroupStyle.passwordInputBackground = this.theme.palette.getAccent50();
    this.createGroupStyle.passwordInputBoxShadow = `${this.theme.palette.getAccent50()} 0px 0px 0px 1px`;
    this.createGroupStyle.passwordPlaceholderTextColor = this.theme.palette.getAccent();
    this.createGroupStyle.passwordPlaceholderTextFont = fontHelper(this.theme.typography.subtitle1);
    this.createGroupStyle.passwordTextColor = this.theme.palette.getAccent();
    this.createGroupStyle.passwordTextFont = fontHelper(this.theme.typography.subtitle2);
    this.createGroupStyle.titleTextFont = fontHelper(this.theme.typography.heading);
    this.createGroupStyle.titleTextColor = this.theme.palette.getAccent();

  }

  /**
   * @param  {GroupListConfiguration} config
   * @param  {GroupListConfiguration} defaultConfig?
   */
  setGroupListConfig() {
    let defaultConfig = new GroupListConfiguration({});
    let config:GroupListConfiguration = this.groupListConfiguration;
    this.loadingIconURL = checkHasOwnProperty(config, "loadingIconURL") ? config.loadingIconURL : defaultConfig!.loadingIconURL;
    this.searchKeyword = checkHasOwnProperty(config, "searchKeyword") ? config.searchKeyword : defaultConfig!.searchKeyword;
    this.hideError = checkHasOwnProperty(config, "hideError") ? config.hideError : defaultConfig!.hideError;
    this.limit = checkHasOwnProperty(config, "limit") ? config.limit : defaultConfig!.limit;
    this.tags = checkHasOwnProperty(config, "tags") ? config.tags : defaultConfig!.tags;
    this.joinedOnly = checkHasOwnProperty(config, "joinedOnly") ? config.joinedOnly : defaultConfig!.joinedOnly;
    this.customView = checkHasOwnProperty(config, "customView") ? config.customView : defaultConfig!.customView;
  };
    /**
   * @param  {PopoverConfiguration} config
   * @param  {PopoverConfiguration} defaultConfig?
   */
     setPopoverConfig() {
     
      let defaultConfig = new PopoverConfiguration({});
      let config:PopoverConfiguration = this.popoverConfiguration;
      this.popOverStyle = checkHasOwnProperty(config, "style") ? config.style : defaultConfig!.style;
    };
    /**
   * @param  {CreateGroupConfiguration} config
   * @param  {CreateGroupConfiguration} defaultConfig?
   */
     setCreateGroupConfig() {
      let defaultConfig = new CreateGroupConfiguration({});
      let config:CreateGroupConfiguration = this.createGroupConfiguration;
      this.onClose = checkHasOwnProperty(config, "onClose") ? config.onClose : defaultConfig!.onClose;
      this.onCreateGroup = checkHasOwnProperty(config, "onCreateGroup") ? config.onCreateGroup : defaultConfig!.onCreateGroup;
      this.closeButtonIconURL = checkHasOwnProperty(config, "closeButtonpIconURL") ? config.closeButtonIconURL : defaultConfig!.closeButtonIconURL;
      this.hideCloseButton = checkHasOwnProperty(config, "hideCloseButton") ? config.hideCloseButton : defaultConfig!.hideCloseButton;
    };
  /**
   * @param  {string} name
   */
  onSearch = (name: string) => {
    this.groupListRef.searchGroup(name);
  }

  /**
* Props dependent styles for the CometChatUserList.
*
*/
  styles: any = {
    groupsWrapperStyle: () => {
      return {
        height: this.style.height,
        width: this.style.width,
        border: this.style.border || `1px solid ${this.theme.palette.getAccent400()}`,
        borderRadius: this.style.borderRadius,
        background: this.style.background || this.theme.palette.getBackground()
      }
    },
    createButtonStyle: () => {
      return {
        WebkitMask: `url(${this.createGroupIconURL}) center center no-repeat`,
        background: this.style.createGroupIconTint || this.theme.palette.getPrimary(),
      }
    }
  }
}
