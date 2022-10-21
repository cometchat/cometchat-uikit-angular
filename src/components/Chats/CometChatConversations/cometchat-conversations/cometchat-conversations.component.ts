import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { ConversationListConfiguration,CometChatTheme, localize, fontHelper} from "../../../Shared";
import { style } from '../../interface'
import * as types from "../../../Shared/Types/typesDeclairation"

import { ConversationType } from "../../../Shared/Constants/UIKitConstants";
import { CometChatConversationListComponent } from "../../CometChatConversationList/cometchat-conversation-list/cometchat-conversation-list.component";
  /**
*
* CometChatConversation is a wrapper component consists of CometChatListBaseComponent and ConversationListComponent.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-conversation",
  templateUrl: "./cometchat-conversations.component.html",
  styleUrls: ["./cometchat-conversations.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationsComponent implements OnInit, OnChanges {
  // getting reference of conversationListComponent.
  @ViewChild("conversationListRef", { static: false }) conversationListRef!: CometChatConversationListComponent;
      /**
   * This properties will come from Parent.
   */
  @Input() title: string = localize("CHATS"); //Title of the component
  @Input() searchPlaceHolder: string = localize("SEARCH"); // placeholder text of search input
  @Input() conversationType: types.conversationTypes = ConversationType.both; //fetch user or group conversations specifically
  @Input() style: style = {
    width: "",
    height: "",
    background: "",
    border: "",
    borderRadius: "",
    titleFont: "",
    titleColor: "",
    backIconTint: "",
    startConversationIconTint: "",
    searchBorder: "none",
    searchBorderRadius: "8px",
    searchBackground: "",
    searchTextFont: "",
    searchTextColor: "",
    searchIconTint: ""
  }; 
  @Input() activeConversation: types.conversationObject | null = null; //selected conversation
  @Input() backButtonIconURL: string = "assets/resources/backbutton.svg"; //image URL of the back button
  @Input() showBackButton: boolean = false; //switch on/off back button
  @Input() searchIconURL: string = "assets/resources/search.svg"; //image URL of the search icon
  @Input() hideSearch: boolean = true; //switch on/ff search input
  @Input() startConversationIconURL: string = ""; // image URL of the start conversation option
  @Input() hideStartConversation: boolean = true; //switch on/ff option to start conversation
  @Input() conversationListConfiguration: ConversationListConfiguration =  new ConversationListConfiguration({});
   /**
     * Properties for internal use
     */
  public loadingIconURL: string = ""; //loadingIconUrl
  @Input() theme: CometChatTheme = new CometChatTheme({});
  public timeout!:number | null;
  // conversation list object for passing
  conversationListObject: any = {
    style: {}
  };
  constructor() { }

  ngOnInit() {
    
    this.checkConfiguration();
    this.setThemeStyle();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["theme"]) {
      this.setThemeStyle();
    }
  }
  // check if configurations is there
  checkConfiguration() {
    let defaultConfig = new ConversationListConfiguration({});
     this.setConversationListConfig(this.conversationListConfiguration, defaultConfig);
  
  }
  // reset unread count when scrolled to bottom of chat
  resetUnreadCount() {
    this.conversationListRef.resetUnreadCount();
  }
  /**
   * setting configuration for child component.
   * @param  {Object} config
   * @param  {Object} defaultConfig
   * @returns defaultConfig
   */
  setConversationListConfig(config:ConversationListConfiguration, defaultConfig: ConversationListConfiguration) {
    this.loadingIconURL = config.loadingIconURL || defaultConfig.loadingIconURL;
    this.conversationListObject.limit = config.limit || defaultConfig.limit;
    this.conversationListObject.userAndGroupTags = config.hasOwnProperty("userAndGroupTags") ? config.userAndGroupTags : defaultConfig.userAndGroupTags;
    this.conversationListObject.tags = config.tags || defaultConfig.tags;
    this.conversationListObject.customView = config.hasOwnProperty("customView") ? config.customView : defaultConfig.customView;
    this.conversationListObject.hideError = config.hasOwnProperty("hideError") ? config.hideError : defaultConfig.hideError;
  }
  // setting theme for listbaseComponent and ConversationListComponent
  setThemeStyle() {
    this.conversationListObject.style.background =   this.theme.palette.getBackground() 
    this.conversationListObject.style.errorStateTextFont = fontHelper(this.theme.typography.heading)
    this.conversationListObject.style.errorStateTextColor = this.theme.palette.getAccent400()
    this.conversationListObject.style.emptyStateTextFont = fontHelper(this.theme.typography.heading)
    this.conversationListObject.style.emptyStateTextColor = this.theme.palette.getAccent400()
    this.style.background = this.theme.palette.getBackground()  
    this.style.titleFont = fontHelper(this.theme.typography.title1)
    this.style.titleColor = this.theme.palette.getAccent()
    this.style.searchBackground = this.theme.palette.getAccent50()
    this.style.searchTextColor =this.theme.palette.getAccent500()
    this.style.searchIconTint = this.theme.palette.getAccent500()
    this.style.backIconTint =this.theme.palette.getAccent500()
    this.style.searchTextFont = fontHelper(this.theme.typography.subtitle2)

  }
  // this object contains dynamic stylings for this component
  styles:any = {
    wrapperStyle:()=>{
      return{
        height: this.style.height ,
        width: this.style.width ,
        border: this.style.border || `1px solid ${this.theme.palette.getAccent400()}`,
        borderRadius: this.style.borderRadius ,
        background: this.style.background || this.theme.palette.getBackground()  ,
        
      }
    }
  }

}
