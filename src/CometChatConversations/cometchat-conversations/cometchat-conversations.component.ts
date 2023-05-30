import {
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { Subscription } from "rxjs";
import {SelectionMode,States, TitleAlignment,ConversationUtils , MessageReceiptUtils, CometChatSoundManager,CometChatUIKitUtility, BaseStyle, ConversationsStyle, ListStyle,  MessageStatus } from "uikit-utils-lerna";
import {CometChatTheme, fontHelper, localize,CometChatOption, CometChatGroupEvents, CometChatUIKitConstants,IGroupLeft, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberScopeChanged,IMessages, CometChatUserEvents, CometChatMessageEvents, CometChatConversationEvents,DatePatterns, CometChatCallEvents} from 'uikit-resources-lerna'
import 'my-cstom-package-lit'
import  { AvatarStyle, ListItemStyle,ConfirmDialogStyle,ReceiptStyle, DateStyle, BadgeStyle} from 'my-cstom-package-lit'
import { CometchatListComponent } from "../../CometChatList/cometchat-list.component";
import { Message } from "@angular/compiler/src/i18n/i18n_ast";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
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
  selector: "cometchat-conversations",
  templateUrl: "./cometchat-conversations.component.html",
  styleUrls: ["./cometchat-conversations.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationsComponent implements OnInit, OnChanges {
  /**
* This properties will come from Parent.
*/
  @Input() subtitleView!: TemplateRef<any>;
  @Input() title: string = localize("CHATS"); //Title of the component
  @Input()   options!: ((member:CometChat.Conversation)=>CometChatOption[]) | null;
  @Input() searchPlaceHolder: string = localize("SEARCH"); // placeholder text of search input
  @Input() disableUsersPresence: boolean = false;
  @Input() disableReceipt: boolean = true;
  @Input() disableTyping:boolean = false;
  @Input() deliveredIcon:string = "assets/message-delivered.svg"
  @Input() readIcon:string = "assets/message-read.svg";
  @Input() errorIcon:string = "assets/warning-small.svg";
  @Input() datePattern:DatePatterns = DatePatterns.DayDateTime;
  @Input() onError:(error:CometChat.CometChatException)=>void = (error:CometChat.CometChatException)=>{
    console.log(error)
  }
  @Input() sentIcon:string = "assets/message-sent.svg";
  @Input() privateGroupIcon:string ="assets/Private.svg";
  @Input() protectedGroupIcon:string = "assets/Locked.svg";
  @Input() customSoundForMessages:string = "";
  @Input() activeConversation: CometChat.Conversation | null = null; //selected conversation
  @Input() searchIconURL: string = "assets/search.svg"; //image URL of the search icon
  @Input() hideSearch: boolean = true; //switch on/ff search input
  @Input() conversationsRequestBuilder: any;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() onSelect!: (conversation:CometChat.Conversation)=>void;
  @Input() loadingIconURL:string = "assets/Spinner.svg"
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_CHATS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() titleAlignment: TitleAlignment = TitleAlignment.left;

  @Input() listItemView!: TemplateRef<any>;
  @Input() menu!: TemplateRef<any>;
  @Input() hideSeparator: boolean = false;
  @Input() searchPlaceholder: string = localize("SEARCH");
  @Input() hideError: boolean = false;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() disableSoundForMessages:boolean = false;
  @Input() confirmDialogTitle = localize("DELETE_CONVERSATION")
  @Input() confirmButtonText: string = localize("DELETE");
  @Input() cancelButtonText: string = localize("CANCEL");
  @Input() confirmDialogMessage: string = localize("WOULD__YOU_LIKE_TO_DELETE_THIS_CONVERSATION");
  @Input() onItemClick!:(conversation:CometChat.Conversation)=>void;
  @Input() deleteConversationDialogStyle: ConfirmDialogStyle = {
    confirmButtonBackground: "",
    cancelButtonBackground: "",
    confirmButtonTextColor: "",
    confirmButtonTextFont: "",
    cancelButtonTextColor: "",
    cancelButtonTextFont: "",
    titleFont: "",
    titleColor: "",
    messageTextFont: "",
    messageTextColor: "",
    background: "",
    border:"1px solid #f2f2f2",
    height:"100%",
    width:"100%"
  }
  @Input() backdropStyle :BaseStyle = {
    height:"100%",
    width:"100%",
    background:"rgba(0, 0, 0, 0.5)"
  }
  @Input() badgeStyle: BadgeStyle = {
    width: "25px",
    height: "15px",
    background: "#5aaeff",
    textColor: "white",
    textFont: "400 13px Inter, sans-serif",
    borderRadius:"16px"
  }
  @Input() dateStyle: DateStyle = {
    textFont: "400 11px Inter, sans-serif",
    textColor: "rgba(20, 20, 20, 0.58)",
  }
  @Input() conversationsStyle: ConversationsStyle = {
    width:"",
    height:"",
    border:"",
    borderRadius:"",
  }
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "",
    borderRadius: "grey",
    titleFont: "",
    titleColor: "",
    border: "",
    separatorColor:"rgb(232, 232, 232)"
  };
  @Input() statusIndicatorStyle: any = {
    height: "10px",
    width: "10px",
    borderRadius: "16px"
  };
  @Input() typingIndicatorText:string = localize("IS_TYPING");
  @Input() threadIndicatorText:string = localize("IN_A_THREAD");
  @Input() avatarStyle: AvatarStyle = {};
  @Input() receiptStyle:ReceiptStyle = {}
  ccGroupMemberAdded!:Subscription;
  ccGroupMemberJoined!:Subscription;
  ccGroupMemberKicked!:Subscription;
  ccGroupMemberBanned!:Subscription;
  ccGroupMemberScopeChanged!:Subscription;
  ccOwnershipChanged!:Subscription;
   ccMessageEdit!: Subscription;
   ccMessageSent!: Subscription;
   ccMessageEdited!: Subscription;
   ccMessageDelete!: Subscription;
   ccGroupDeleted!: Subscription;
   ccGroupLeft!: Subscription;
   ccUserBlocked!: Subscription;
   ccMessageRead!: Subscription;
   public ccOutgoingCall!: Subscription;
   public ccCallRejected!: Subscription;
   public ccCallEnded!: Subscription;
   public ccCallAccepted!:Subscription;
  iconStyle:any = {
    iconTint:"lightgrey",
    height:"20px",
    width:"20px"
  }
  listStyle:ListStyle = new ListStyle({})
  menustyle = {
    width: "",
    height: "",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    textFont: "",
    textColor: "black",
    iconTint: "grey",
    iconBackground: "transparent",
    iconBorder: "none",
    iconBorderRadius: "0",
    submenuWidth: "70px",
    submenuHeight: "20px",
    submenuBorder: "1px solid #e8e8e8",
    submenuBorderRadius: "8px",
    submenuBackground: "white",
  }
  public typingIndicator!:CometChat.TypingIndicator | null
  public typingListenerId: string = "conversation__LISTENER" + new Date().getTime();
  public callListenerId = "call_"+ new Date().getTime();
  selectionmodeEnum: typeof SelectionMode = SelectionMode;
  public isDialogOpen: boolean = false;
  // public loggedInUser!: CometChat.User | null;
  public isEmpty: boolean = false;
  public isLoading: boolean = true;
  public state: States = States.loading;
  public statusColor: any = {
    online: "",
    private: "",
    password: "#F7A500",
    public: ""
  }
  public limit:number = 30;
  public isError: boolean = false;
  public conversationList: CometChat.Conversation[] = [];
  public scrolledToBottom: boolean = false;
  public checkItemChange: boolean = false;
  conversationOptions!:CometChatOption[];
  public showConfirmDialog: boolean = false;
  public conversationToBeDeleted: CometChat.Conversation | null = null;
  public conversationListenerId: string = "chatlist_" + new Date().getTime();
  public userListenerId: string = "chatlist_user_" + new Date().getTime();
  public groupListenerId: string = "chatlist_group_" + new Date().getTime();
  public groupToUpdate: CometChat.Group | {} = {};
  enablePolls:boolean = false;
  enableStickers:boolean = false;
  enableWhiteboard:boolean = false
  enableDocument:boolean = false
  threadIconURL:string = "assets/thread-arrow.svg"
  public confirmDialogStyle: ConfirmDialogStyle = {
    height: "100%",
    width: "100%",
    borderRadius: "8px"
  }
  subtitleValue!: string;
  modalStyle:BaseStyle = {
    height:"230px",
    width:"270px"

  }
  /**
    * Properties for internal use
    */
  public localize = localize;
  /**
* This properties will come from Parent.
*/
  @Input() loggedInUser!: CometChat.User | null;
  /**
  * Properties for internal use
  */
  /**
   * passing this callback to menuList component on delete click
   * @param  {CometChat.Conversation} conversation
   */
  deleteConversationOnClick: (()=>void) | null =  ()=> {
   this.showConfirmationDialog(this.conversationToBeDeleted!)
  }
  // callback for confirmDialogComponent
  onConfirmClick = () => {
      this.deleteSelectedConversation();
  }
  setStatusIndicatorStyle = (conversation: CometChat.Conversation) => {
    if (conversation.getConversationType() == CometChatUIKitConstants.MessageReceiverType.group) {
      return {
        height: "12px",
        width: "12px",
        borderRadius: "16px"
      }
    }
    else {
      return this.statusIndicatorStyle
    }
  }

  /**
 * @param  {CometChat.Conversation} conversation
 */
  checkStatusType(conversation: CometChat.Conversation) {
    let user:CometChat.User = conversation.getConversationWith() as CometChat.User
    if (conversation.getConversationType() == CometChatUIKitConstants.MessageReceiverType.user && !this.disableUsersPresence) {
      return this.statusColor[user.getStatus()]
    }
    else {
      return this.statusColor[conversation.getConversationType()]
    }
  }
  getExtensionData(messageObject: CometChat.BaseMessage) {
    let messageText
    //xss extensions data
    const xssData = CometChatUIKitUtility.checkMessageForExtensionsData(messageObject, "xss-filter");
    if (xssData && CometChatUIKitUtility.checkHasOwnProperty(xssData, "sanitized_text") && CometChatUIKitUtility.checkHasOwnProperty(xssData, "hasXSS") && xssData.hasXSS === "yes") {
      messageText = xssData.sanitized_text;
    }
    //datamasking extensions data
    const maskedData = CometChatUIKitUtility.checkMessageForExtensionsData(messageObject, "data-masking");
    if (maskedData && CometChatUIKitUtility.checkHasOwnProperty(maskedData, "data") && CometChatUIKitUtility.checkHasOwnProperty(maskedData.data, "sensitive_data") && CometChatUIKitUtility.checkHasOwnProperty(maskedData.data, "message_masked") && maskedData.data.sensitive_data === "yes") {
      messageText = maskedData.data.message_masked;
    }
    //profanity extensions data
    const profaneData = CometChatUIKitUtility.checkMessageForExtensionsData(messageObject, "profanity-filter");
    if (profaneData && CometChatUIKitUtility.checkHasOwnProperty(profaneData, "profanity") && CometChatUIKitUtility.checkHasOwnProperty(profaneData, "message_clean") && profaneData.profanity === "yes") {
      messageText = profaneData.message_clean;
    }
    return messageText || (messageObject as any).text
  }
  setSubtitle = (conversationObject: CometChat.Conversation) => {
    if (this.typingIndicator) {
      const isTyping = (conversationObject as any)?.conversationWith?.guid == this.typingIndicator.getReceiverId();
      if (isTyping) {
        return `${this.typingIndicator.getSender().getName()} ${this.typingIndicatorText}`;
      } else if ((conversationObject as any)?.conversationWith?.uid == this.typingIndicator?.getSender().getUid() && this.typingIndicator.getReceiverType() !== CometChatUIKitConstants.MessageReceiverType.group) {
        return this.typingIndicatorText;
      }
    }
    let subtitle =  ChatConfigurator.getDataSource().getLastConversationMessage(conversationObject, this.loggedInUser!)
    let icon = conversationObject?.getLastMessage()?.getType() == CometChatUIKitConstants.MessageTypes.audio ? "📞 " : "📹 "
    return conversationObject?.getLastMessage()?.getCategory() == CometChatUIKitConstants.MessageCategory.call ? icon + subtitle : subtitle
  }
  checkGroupType(conversation: CometChat.Conversation): string {
    let image: string = "";
    if (conversation.getConversationType() == CometChatUIKitConstants.MessageReceiverType.group) {
      switch (conversation.getConversationType()) {
        case CometChatUIKitConstants.GroupTypes.password:
          image = this.protectedGroupIcon;
          break;
        case CometChatUIKitConstants.GroupTypes.private:
          image = this.privateGroupIcon;
          break;
        default:
          image = ""
          break;
      }
    }
    return image
  }
  // callback for confirmDialogComponent
  onCancelClick = () => {
    this.isDialogOpen = false
    this.conversationToBeDeleted = null
    this.ref.detectChanges()
  }
  getMessageReceipt = (conversation: CometChat.Conversation) => {
    let receipt = MessageReceiptUtils.getReceiptStatus(conversation.getLastMessage())
    return receipt
  }
  getDate(){
    return this.datePattern || DatePatterns.DayDateTime
  }
  optionsStyle = {
    background: "transparent",
    border: "none"
  }
  isActive: boolean = true;
  contactsNotFound: boolean = false;
  chatSearch!: boolean;
  constructor(private ngZone: NgZone,private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
  }

  ngOnInit() {
    this.setThemeStyle();
    this.subscribeToEvents()
if(this.conversationsRequestBuilder){
  this.conversationsRequestBuilder?.build()
}
else{
  this.conversationsRequestBuilder = new CometChat.ConversationsRequestBuilder().setLimit(this.limit).build()
}
    this.state = States.loading;
    this.setConversationOptions();
    try {
      this.getConversation();
      this.attachListeners(this.conversationUpdated);
    } catch (error: any) {
      if(this.onError){
        this.onError(error)
      }
    }
    this.ref.detectChanges()
  }
updateConversationObject(conversation:CometChat.Conversation){
  let index = this.conversationList.findIndex((element: CometChat.Conversation) => element.getConversationId() == conversation.getConversationId());
  this.conversationList.splice(index, 1, conversation);
  this.ref.detectChanges()
}
  subscribeToEvents(){
    this.ccGroupMemberScopeChanged = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((item:IGroupMemberScopeChanged)=>{
      let conversation = this.getConversationFromGroup(item.group!)
      if(conversation){
        conversation.setLastMessage(item.message)
        this.updateConversationObject(conversation)
      }
    })
    this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item:IGroupMemberAdded)=>{
      let group:CometChat.Group = item.userAddedIn!
      let actionMessage:CometChat.Action[] = item.messages!
      let conversation:CometChat.Conversation | null = this.getConversationFromGroup(item.userAddedIn!)
      conversation?.setConversationWith(group)
      conversation?.setLastMessage(actionMessage[actionMessage?.length -1])
      this.updateConversationObject(conversation!)
    })
    this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item:IGroupMemberKickedBanned)=>{
         let conversation = this.getConversationFromGroup(item.kickedFrom!)
         if(conversation){
           conversation.setLastMessage(item.message)
           this.updateConversationObject(conversation)
         }
    });
    this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item:IGroupMemberKickedBanned)=>{
      let conversation = this.getConversationFromGroup(item.kickedFrom!)
      if(conversation){
        conversation.setLastMessage(item.message)
        this.updateConversationObject(conversation)
      }
    });
    this.ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe((item:CometChat.Group)=>{
      let conversation:CometChat.Conversation | null = this.getConversationFromGroup(item)
      if(conversation){
     this.removeConversation(conversation)
      }
    });
    this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item:IGroupLeft)=>{

      this.updateConversation(item.message!)
      this.ref.detectChanges();
    });
    this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((item:CometChat.User)=>{
      let conversation:CometChat.Conversation | null = this.getConversationFromUser(item)
      if(conversation){
        this.removeConversation(conversation)
         }
    });
    this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object: IMessages) => {
      let message: CometChat.BaseMessage = object.message!
      if(object.status == MessageStatus.success){
        this.updateEditedMessage(message as CometChat.TextMessage)
      }
   })
   this.ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe((obj: IMessages) => {
     let message: CometChat.BaseMessage = obj.message!
     if(obj.status == MessageStatus.success){
       this.updateConversation(message)
     }
   })
   this.ccMessageDelete = CometChatMessageEvents.ccMessageDeleted.subscribe((messageObject: CometChat.BaseMessage) => {
       this.updateConversation(messageObject)
       this.ref.detectChanges();
   })
   this.ccMessageRead = CometChatMessageEvents.ccMessageRead.subscribe((messageObject: CometChat.BaseMessage) => {
  CometChat.CometChatHelper.getConversationFromMessage(messageObject).then((conversation:CometChat.Conversation)=>{
    if(conversation &&  this.activeConversation && conversation?.getConversationId() == this.activeConversation?.getConversationId()){
      this.updateEditedMessage(messageObject as CometChat.TextMessage)
      this.resetUnreadCount();
    }
  })
  })
  this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call:CometChat.Call)=>{
    if(call){
      this.updateConversation(call)
    }
  })
  this.ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe((call: CometChat.Call) => {
    this.updateConversation(call)
  })
  this.ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe((call: CometChat.Call) => {
    this.updateConversation(call)
  })
  this.ccCallAccepted = CometChatCallEvents.ccCallAccepted.subscribe((call: CometChat.Call) => {
    this.updateConversation(call)
  })
  }
  unsubscribeToEvents(){
    this.ccGroupMemberAdded?.unsubscribe();
    this.ccGroupMemberKicked?.unsubscribe();
    this.ccGroupMemberBanned?.unsubscribe();
    this.ccMessageEdit?.unsubscribe();
    this.ccMessageSent?.unsubscribe();
    this.ccMessageEdited?.unsubscribe();
    this.ccMessageDelete?.unsubscribe();
    this.ccGroupDeleted?.unsubscribe();
    this.ccGroupLeft?.unsubscribe();
    this.ccUserBlocked?.unsubscribe();
    this.ccMessageRead?.unsubscribe();
  }
  getConversationFromUser(user:CometChat.User){
    let index = this.conversationList.findIndex((element: CometChat.Conversation) => element.getConversationType() == CometChatUIKitConstants.MessageReceiverType.user &&  (element.getConversationWith() as CometChat.User).getUid() == user.getUid());
    if(index >= 0){
      return this.conversationList[index]
    }
    return null
  }
  getConversationFromGroup(group:CometChat.Group):CometChat.Conversation | null{
  let index = this.conversationList.findIndex((element: CometChat.Conversation) => element.getConversationType() == CometChatUIKitConstants.MessageReceiverType.group &&  (element.getConversationWith() as CometChat.Group).getGuid() == group.getGuid());
    if(index >= 0){
      return this.conversationList[index]
    }
    return null
  }
  ngOnChanges(change: SimpleChanges) {
    try {
      if(change["activeConversation"]){
        this.resetUnreadCount()
      }
      /**
       * When user sends message conversationList is updated with latest message
       */
    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
    }
  }
  ngOnDestroy() {
    try {
      this.removeListeners();
      this.unsubscribeToEvents()
    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
    }
    this.ref.detectChanges()
  }
  // getting default conversation option and adding callback in it
  setConversationOptions() {
 if(this.options){
 return;
 }
 this.conversationOptions = ConversationUtils.getDefaultOptions();
 this.conversationOptions.forEach((element: CometChatOption) => {
   if (!element.onClick && element.id == CometChatUIKitConstants.ConversationOptions.delete) {
     element.onClick = this.deleteConversationOnClick
   }
 });
 return;
  }
  // reset unread count
  onClick(conversation: CometChat.Conversation) {
   if(this.onItemClick){
     this.onItemClick(conversation)
   }
  }
  // set unread count
  resetUnreadCount() {
    if (this.activeConversation) {
      const conversationlist: CometChat.Conversation[] = [...this.conversationList];
      //Gets the index of user which comes offline/online
      const conversationKey = conversationlist.findIndex(
        (conversationObj: CometChat.Conversation) =>
          conversationObj?.getConversationId() === this.activeConversation?.getConversationId()
      );
      if (conversationKey > -1) {
        let conversationObj: CometChat.Conversation = conversationlist[conversationKey];
        let newConversationObj: CometChat.Conversation = conversationObj
        newConversationObj.setUnreadMessageCount(0);
        (newConversationObj.getLastMessage() as CometChat.TextMessage)?.setMuid(this.getUinx())
        conversationlist.splice(conversationKey, 1, newConversationObj);
        this.conversationList = [...conversationlist];
        this.ref.detectChanges()
      }
    }
  }
  // sets property from theme to style object
  setThemeStyle() {
    this.setAvatarStyle();
    this.setBadgeStyle();
    this.setConfirmDialogStyle();
    this.setConversationsStyle();
    this.setListItemStyle();
    this.setDateStyle();
    this.setStatusStyle();
    this.setReceiptStyle();
    this.statusColor.private =this.conversationsStyle?.privateGroupIconBackground ;
    this.statusColor.online =this.conversationsStyle?.onlineStatusColor ;
    this.statusColor.password =this.conversationsStyle?.passwordGroupIconBackground;
    this.listStyle ={
      titleTextFont : this.conversationsStyle.titleTextFont,
      titleTextColor : this.conversationsStyle.titleTextColor,
      emptyStateTextFont : this.conversationsStyle.emptyStateTextFont,
      emptyStateTextColor : this.conversationsStyle.emptyStateTextColor,
      errorStateTextFont : this.conversationsStyle.errorStateTextFont,
      errorStateTextColor : this.conversationsStyle.errorStateTextColor,
      loadingIconTint : this.conversationsStyle.loadingIconTint,
      separatorColor : this.conversationsStyle.separatorColor,
    }
    this.iconStyle.iconTint =    this.themeService.theme.palette.getAccent400();
  }
  setListItemStyle(){
    let defaultStyle:ListItemStyle = new ListItemStyle({
      height: "100%",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: this.themeService.theme.palette.getAccent50(),
      borderRadius: "0",
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      titleColor: this.themeService.theme.palette.getAccent(),
      border: "none",
      separatorColor:this.themeService.theme.palette.getAccent200(),
      hoverBackground:this.themeService.theme.palette.getAccent50()
    })
    this.listItemStyle = {...defaultStyle,...this.listItemStyle}
  }
  setAvatarStyle(){
    let defaultStyle:AvatarStyle = new AvatarStyle({
      borderRadius: "24px",
      width: "36px",
      height: "36px",
      border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
      backgroundColor: this.themeService.theme.palette.getAccent700(),
      nameTextColor: this.themeService.theme.palette.getAccent900(),
      backgroundSize: "cover",
      nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      outerViewBorder: "",
      outerViewBorderSpacing: "",
    })
    this.avatarStyle = {...defaultStyle,...this.avatarStyle}
  }
  setStatusStyle(){
    let defaultStyle:BaseStyle = {
        height: "12px",
        width:"12px",
        border:"none",
        borderRadius:"24px",
    }
    this.statusIndicatorStyle = {...defaultStyle,...this.statusIndicatorStyle}
  }
  setConversationsStyle(){
    let defaultStyle:ConversationsStyle = new ConversationsStyle({
      lastMessageTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      lastMessageTextColor: this.themeService.theme.palette.getAccent600(),
      background:this.themeService.theme.palette.getBackground(),
      border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
      titleTextFont:fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:this.themeService.theme.palette.getAccent(),
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      separatorColor:this.themeService.theme.palette.getAccent400(),
      privateGroupIconBackground:this.themeService.theme.palette.getSuccess(),
      passwordGroupIconBackground:"RGB(247, 165, 0)",
      typingIndictorTextColor:this.themeService.theme.palette.getPrimary(),
      typingIndictorTextFont:fontHelper(this.themeService.theme.typography.subtitle2),
      threadIndicatorTextFont:fontHelper(this.themeService.theme.typography.caption2),
      threadIndicatorTextColor:this.themeService.theme.palette.getAccent600(),
    })
    this.conversationsStyle = {...defaultStyle,...this.conversationsStyle}
  }
  setDateStyle(){
    let defaultStyle:DateStyle = new DateStyle({
      textFont: fontHelper(this.themeService.theme.typography.caption2),
      textColor: this.themeService.theme.palette.getAccent600(),
      background:"transparent"
    })
    this.dateStyle = {...defaultStyle,...this.dateStyle}
  }
  setReceiptStyle(){

    let defaultStyle:ReceiptStyle = new ReceiptStyle({
waitIconTint:this.themeService.theme.palette.getAccent700(),
sentIconTint:this.themeService.theme.palette.getAccent600(),
deliveredIconTint:this.themeService.theme.palette.getAccent600(),
readIconTint:this.themeService.theme.palette.getPrimary(),
errorIconTint:this.themeService.theme.palette.getError(),
    })
    this.receiptStyle = {...defaultStyle,...this.receiptStyle}
  }
  setBadgeStyle(){
    let defaultStyle:BadgeStyle = new BadgeStyle({
      textFont: fontHelper(this.themeService.theme.typography.subtitle2),
      textColor: this.themeService.theme.palette.getAccent("dark"),
      background:this.themeService.theme.palette.getPrimary(),
      borderRadius:"16px",
      width:"24px",
    })
    this.badgeStyle = {...defaultStyle,...this.badgeStyle}
  }
  setConfirmDialogStyle(){
    let defaultStyle:ConfirmDialogStyle = new ConfirmDialogStyle({
      confirmButtonBackground: this.themeService.theme.palette.getError(),
      cancelButtonBackground: this.themeService.theme.palette.getSecondary(),
      confirmButtonTextColor: this.themeService.theme.palette.getAccent900("light"),
      confirmButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
      cancelButtonTextColor: this.themeService.theme.palette.getAccent900("dark"),
      cancelButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
      titleFont: fontHelper(this.themeService.theme.typography.title1),
      titleColor: this.themeService.theme.palette.getAccent(),
      messageTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      messageTextColor: this.themeService.theme.palette.getAccent600(),
      background: this.themeService.theme.palette.getBackground(),
      height:"100%",
      width:"350px",
    })
    this.deleteConversationDialogStyle = {...defaultStyle,...this.deleteConversationDialogStyle}
  }
  // checking if user has his own configuration else will use default configuration
  /**
   * @param  {Object={}} config
   * @param  {Object} defaultConfig?
   * @returns defaultConfig
   */
  // calling subtitle callback from configurations
  /**
   * @param  {CometChat.Conversation} conversation
   */
  /**
   * Fetches the coversation based on the conversationRequest config
   */
  fetchNextConversation() {
    try {
      return this.conversationsRequestBuilder?.fetchNext();
    } catch (error: any) {
      if(this.onError){
        this.onError(error)
      }
    }
  }
  updateEditedMessage(message:CometChat.TextMessage){
    let index = this.conversationList.findIndex(
      (conversationObj: CometChat.Conversation) => conversationObj.getLastMessage() && (conversationObj.getLastMessage() as CometChat.BaseMessage).getId() == message?.getId()
    );
    if(index >= 0){
      this.conversationEditedDeleted(message)
    }
  }
  /**
   * attaches Listeners for user activity , group activities and calling
   * @param callback
   */
  /**
   * @param  {Function} callback
   */
  attachListeners(callback: any) {
    try {
      if (!this.disableUsersPresence) {
        CometChat.addUserListener(
          this.userListenerId,
          new CometChat.UserListener({
            onUserOnline: (onlineUser: object) => {
              /* when someuser/friend comes online, user will be received here */
              callback(CometChatUIKitConstants.userStatusType.online, onlineUser);
            },
            onUserOffline: (offlineUser: object) => {
              /* when someuser/friend went offline, user will be received here */
              callback(CometChatUIKitConstants.userStatusType.offline, offlineUser);
            },
          })
        );
      }
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            message: any,
            changedUser: any,
            newScope: any,
            oldScope: any,
            changedGroup: any
          ) => {
            this.updateConversation(message)
          },
          onGroupMemberKicked: (message: any, kickedUser: any, kickedBy: any, kickedFrom: any) => {
            this.updateConversation(message)
          },
          onGroupMemberBanned: (message: any, bannedUser: any, bannedBy: any, bannedFrom: any) => {
            this.updateConversation(message)
          },
          onGroupMemberUnbanned: (
            message: any,
            unbannedUser: any,
            unbannedBy: any,
            unbannedFrom: any
          ) => {
            // this.updateConversation(message)
          },
          onMemberAddedToGroup: (
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any
          ) => {
            this.updateConversation(message)
          },
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
            this.updateConversation(message)
          },
          onGroupMemberJoined: (message: any, joinedUser: any, joinedGroup: any) => {
            this.updateConversation(message)
          },
        })
      );
      CometChat.addMessageListener(
        this.conversationListenerId,
        new CometChat.MessageListener({
          onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
            callback(CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED, null, textMessage);
          },
          onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
            callback(CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED, null, mediaMessage);
          },
          onCustomMessageReceived: (customMessage: CometChat.BaseMessage) => {
              callback(CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED, null, customMessage);

          },
          onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
            if (!this.disableReceipt) {
              this.markAsRead(messageReceipt);
            }
          },
          onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
            callback(CometChatUIKitConstants.messages.MESSAGE_DELETED, null, deletedMessage);
          },
          onMessageEdited: (editedMessage: CometChat.BaseMessage) => {
            callback(CometChatUIKitConstants.messages.MESSAGE_EDITED, null, editedMessage);
          },
          onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
            if (!this.disableReceipt) {
              this.updateDeliveredMessage(messageReceipt);
            }
          },
          onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
            if(!this.disableTyping){
              this.typingIndicator = typingIndicator
           this.ref.detectChanges()
            }
          },
          onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
            this.typingIndicator = null
            this.ref.detectChanges()
          }
        })
      );
        CometChat.addCallListener(
          this.callListenerId,
          new CometChat.CallListener({
            onIncomingCallReceived: (call: CometChat.Call) => {
              this.updateConversation(call)
            },
            onIncomingCallCancelled: (call: CometChat.Call) => {
              this.updateConversation(call)
            },
            onOutgoingCallRejected: (call: CometChat.Call) => {
              this.updateConversation(call)

            },
            onOutgoingCallAccepted: (call: CometChat.Call) => {
              this.updateConversation(call)
            },

          })
        );

    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
    }
  }
  /**
   * Removes all listeners
   */
  removeListeners() {
    try {
      CometChat.removeMessageListener(this.conversationListenerId);
      CometChat.removeUserListener(this.userListenerId);
      CometChat.removeGroupListener(this.groupListenerId);
    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
    }
  }
  /**
   * Fetches Conversations Details with all the users
   */
  getConversation = () => {
    if((this.conversationsRequestBuilder && !this.conversationsRequestBuilder?.pagination) ||  (this.conversationsRequestBuilder.pagination.current_page == 0 || this.conversationsRequestBuilder.pagination.current_page !=  this.conversationsRequestBuilder.pagination.total_pages)){
      this.state = States.loading
      try {
        CometChat.getLoggedinUser()
          .then((user: CometChat.User | null) => {
            this.loggedInUser = user;
            this.fetchNextConversation()
              .then((conversationList: CometChat.Conversation[]) => {
                conversationList.forEach((conversation: CometChat.Conversation) => {
                  if (
                    this.activeConversation && this.activeConversation !== null &&
                    this.activeConversation.getConversationType() === conversation.getConversationType()
                  ) {
                    if (
                      this.activeConversation.getConversationId() == conversation.getConversationId()
                    ) {
                      conversation.setUnreadMessageCount(0);
                    }
                  }
                });
                this.conversationList = [
                  ...this.conversationList,
                  ...conversationList,
                ];
                if ((conversationList.length <= 0 && this.conversationList?.length <= 0) || (conversationList.length === 0 && this.conversationList?.length <= 0)) {
                  this.ngZone.run(() => {
                    if(this.state != States.empty){
                     this.state = States.empty
                     this.ref.detectChanges()
                    }
                      this.ref.detach(); // Detach the change detector
                    });
                } else {
                  this.ngZone.run(() => {
                    if(this.state != States.loaded){
                     this.state = States.loaded
                     this.ref.detectChanges()
                    }
                      this.ref.detach(); // Detach the change detector
                    });

                }
              })
              .catch((error: any) => {
                this.state = States.error
                this.ref.detectChanges();
              });
          })
          .catch((error: any) => {
            this.state = States.error
            this.ref.detectChanges();
          });
      } catch (error: any) {
              if(this.onError){
          this.onError(error)
        }
      }
    }
    else{
      this.state = States.loaded;
    }
  }
  isReceiptDisable(conversation:CometChat.Conversation){
    let item:any = conversation.getConversationWith()
    let message:CometChat.BaseMessage = conversation.getLastMessage()
    if(!this.disableReceipt && message && message?.getCategory() != CometChatUIKitConstants.MessageCategory.action && message?.getCategory() != CometChatUIKitConstants.MessageCategory.call
    && (!this.typingIndicator || (item?.uid != this.typingIndicator.getReceiverId() && item?.guid != this.typingIndicator.getReceiverId()))
    && message.getSender()?.getUid() == this.loggedInUser?.getUid()
   )
    {
      return true
    }
    else{
      return false
    }
  }
  /**
   * Updates the conversation list's last message , badgeCount , user presence based on activities propagated by listeners
   */
  conversationUpdated = (
    key: any,
    item: CometChat.User | CometChat.Group | null = null,
    message: CometChat.BaseMessage,
    options = null
  ) => {
    try {
      switch (key) {
        case CometChatUIKitConstants.userStatusType.online:
        case CometChatUIKitConstants.userStatusType.online: {
          this.updateUser(item);
          break;
        }
        case CometChatUIKitConstants.messages.MESSAGE_READ: {
          this.updateConversation(message, false)
          break;
        }
        case CometChatUIKitConstants.messages.MESSAGE_DELIVERED: {
          this.updateConversation(message, false)
          break;
        }
        case CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED:
        case CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED:
        case CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED:
          if(!this.disableReceipt){
            this.markMessageAsDelivered(message);
          }
          this.updateConversation(message);
          break;
        case CometChatUIKitConstants.groupMemberAction.ADDED:
        case CometChatUIKitConstants.groupMemberAction.BANNED:
        case CometChatUIKitConstants.groupMemberAction.JOINED:
        case CometChatUIKitConstants.groupMemberAction.KICKED:
        case CometChatUIKitConstants.groupMemberAction.LEFT:
        case CometChatUIKitConstants.groupMemberAction.UNBANNED:
        case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
          this.updateConversation(message)
          break;
        case CometChatUIKitConstants.messages.MESSAGE_EDITED:
        case CometChatUIKitConstants.messages.MESSAGE_DELETED:
          this.conversationEditedDeleted(message);
          break;
      }
    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
    }
  };
  /**
   * @param  {CometChat.BaseMessage} message
   */
  markMessageAsDelivered = (message: CometChat.BaseMessage) => {
    //if chat window is not open, mark message as delivered
    if (this.activeConversation?.getConversationType() == CometChatUIKitConstants.MessageReceiverType.user) {
      if ((!this.activeConversation || (this.activeConversation?.getConversationWith() as CometChat.User)?.getUid() !== message?.getSender()?.getUid())
        && !message.hasOwnProperty("deliveredAt")) {
        CometChat.markAsDelivered(message)
      }
    }
    else {
      if ((!this.activeConversation || (this.activeConversation?.getConversationWith() as CometChat.Group)?.getGuid() !== message?.getReceiverId())
        && !message.hasOwnProperty("deliveredAt")) {
        CometChat.markAsDelivered(message)
      }
    }
  };
  /**
   * @param  {CometChat.BaseMessage} readMessage
   */
  getUinx = () => {
    return String(Math.round(+new Date() / 1000))
  }
  markAsRead(readMessage: CometChat.MessageReceipt) {
    let conversationlist: CometChat.Conversation[] = [...this.conversationList]
    const conversationKey = conversationlist.findIndex(
      (conversationObj: CometChat.Conversation) => (conversationObj.getLastMessage() as CometChat.BaseMessage).getReceiverId() == readMessage.getSender().getUid()
    );
    if (conversationKey > -1) {
      let newConversationObject!: CometChat.Conversation;
      if (!(conversationlist[conversationKey].getLastMessage() as CometChat.TextMessage).getReadAt()) {
        newConversationObject = conversationlist[conversationKey];
        (newConversationObject.getLastMessage() as CometChat.TextMessage).setReadAt(readMessage.getReadAt());
        (newConversationObject.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx());
        conversationlist.splice(conversationKey, 1, newConversationObject);
        this.conversationList = [...conversationlist];

      }
    }
  }
  /**
   * Updates Detail when user comes online/offline
   * @param
   */
  /**
   * @param  {CometChat.User|CometChat.Group|null} user
   */
  updateUser(user: CometChat.User | CometChat.Group | null) {
    try {
      //when user updates
      const conversationlist: CometChat.Conversation[] = [...this.conversationList];
      //Gets the index of user which comes offline/online
      const conversationKey = conversationlist.findIndex(
        (conversationObj: CometChat.Conversation) =>
          conversationObj.getConversationType() === CometChatUIKitConstants.MessageReceiverType.user &&
          (conversationObj.getConversationWith() as CometChat.User).getUid() === (user as CometChat.User).getUid()
      );
      if (conversationKey > -1) {
        let conversationObj: CometChat.Conversation = conversationlist[conversationKey];
        let conversationWithObj: CometChat.User = (conversationObj.getConversationWith() as CometChat.User)
        conversationWithObj.setStatus((user as CometChat.User).getStatus())
        let newConversationObj: CometChat.Conversation = conversationObj
        newConversationObj.setConversationWith(conversationWithObj);
        (newConversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx())
        conversationlist.splice(conversationKey, 1, newConversationObj);
        this.conversationList = conversationlist;
        this.ref.detectChanges()
      }
    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
      this.ref.detectChanges();
    }
  }
  /**
   *
   * Gets the last message
   * @param conversation
  /**
   * @param  {CometChat.BaseMessage} message
   * @param  {CometChat.Conversation|{}} conversation
   */
  makeLastMessage(message: CometChat.BaseMessage, conversation: CometChat.Conversation | {} = {}) {
    const newMessage = message;
    return newMessage;
  }
  /**
   *
   * Updates Conversations as Text/Custom Messages are received
   * @param
   *
   */
  /**
   * @param  {CometChat.BaseMessage} message
   * @param  {boolean} notification
   */
  updateConversation(message: CometChat.BaseMessage, notification: boolean = true) {
    try {
      this.makeConversation(message)
        .then((response: any) => {

          const conversationKey = response.conversationKey;
          const conversationObj: CometChat.Conversation = response.conversationObj;
          const conversationList = response.conversationList;
          if (conversationKey > -1) {
            // if sender is not logged in user then  increment count
            let unreadMessageCount = this.loggedInUser?.getUid() != message.getSender().getUid() || this.loggedInUser?.getUid() == message.getReceiverId() ? this.makeUnreadMessageCount(
              conversationObj
            ) : this.makeUnreadMessageCount(conversationObj) - 1;
            let lastMessageObj: CometChat.BaseMessage = this.makeLastMessage(message, conversationObj);
            let newConversationObj: CometChat.Conversation = conversationObj
            newConversationObj.setLastMessage(lastMessageObj);
            newConversationObj.setUnreadMessageCount(unreadMessageCount);
            (newConversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx())
            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.conversationList = [...conversationList];
            if (notification && this.loggedInUser?.getUid() != message?.getSender()?.getUid()) {
              this.playAudio();
              this.ref.detectChanges()
            }
          } else {
            let lastMessageObj = this.makeLastMessage(message);
            conversationObj.setLastMessage(lastMessageObj);
            conversationObj.setUnreadMessageCount(1)
            conversationList.unshift(conversationObj);
            this.conversationList = conversationList;
            this.ref.detectChanges()
            // this.ref.detectChanges()
            if (notification && this.loggedInUser?.getUid() != message?.getSender()?.getUid()) {
              this.playAudio();
              this.ref.detectChanges()
            }
          }
          this.ref.detectChanges()
        })
        .catch((error: any) => {
          if(this.onError){
            this.onError(error)
          }
          this.ref.detectChanges()
        });
    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
    }
    this.ref.detectChanges()
  }
  updateDeliveredMessage(messageReceipt: CometChat.MessageReceipt) {
    let conversationList: CometChat.Conversation[] = [...this.conversationList];
    let conversationKey: number = conversationList.findIndex(
      (c: CometChat.Conversation) => (c.getLastMessage() as CometChat.TextMessage).getId() == Number(messageReceipt.getMessageId())
    );
    let conversationObj: CometChat.Conversation;
    if (conversationKey > -1) {
      conversationObj = conversationList[conversationKey];
      if (!(conversationObj.getLastMessage() as CometChat.TextMessage).getDeliveredAt()) {
        (conversationObj.getLastMessage() as CometChat.TextMessage).setDeliveredAt(Number(this.getUinx()));
        (conversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx());
        conversationList.splice(conversationKey, 1, conversationObj)
        this.conversationList = [...conversationList];
        this.ref.detectChanges()
      }
    }
  }
  /**
   *
   * Gets The Count of Unread Messages
   * @param
   */
  /**
   * @param  {any} conversation
   * @param  {any} operator
   */
  makeUnreadMessageCount(conversation: CometChat.Conversation, operator: any = null) {
    if (Object.keys(conversation).length === 0) {
      return 1;
    }
    let unreadMessageCount:number = conversation.getUnreadMessageCount();
    if (
      this.activeConversation &&
      this.activeConversation.getConversationId() === conversation.getConversationId()
    ) {
      unreadMessageCount += 1;
    } else if (
      (this.activeConversation &&
        this.activeConversation.hasOwnProperty("guid") &&
        conversation.getConversationWith().hasOwnProperty("guid") &&
        (this.activeConversation.getConversationWith() as CometChat.Group).getGuid() === (conversation.getConversationWith() as CometChat.Group).getGuid()) ||
      (this.activeConversation &&
        this.activeConversation.hasOwnProperty("uid") &&
        conversation.getConversationWith().hasOwnProperty("uid") &&
        (this.activeConversation.getConversationWith() as CometChat.User).getUid() === (conversation.getConversationWith() as CometChat.User).getUid())
    ) {
      unreadMessageCount = 0;
    } else {
      if (operator && operator === "decrement") {
        unreadMessageCount = unreadMessageCount ? unreadMessageCount - 1 : 0;
      } else {
        unreadMessageCount = unreadMessageCount + 1;
      }
    }
    return unreadMessageCount;
  }
  /**
   * Changes detail of conversations
   * @param
   */
  /**
   * @param  {CometChat.BaseMessage} message
   */
  makeConversation(message: CometChat.BaseMessage) {
    const promise = new Promise((resolve, reject) => {
      CometChat.CometChatHelper.getConversationFromMessage(message)
        .then((conversation: CometChat.Conversation) => {
          let conversationList: CometChat.Conversation[] = [...this.conversationList];
          let conversationKey: number = conversationList.findIndex(
            (c: CometChat.Conversation) => c?.getConversationId() === conversation.getConversationId()
          );
          let conversationObj: CometChat.Conversation = conversation;
          if (conversationKey > -1) {
            conversationObj = conversationList[conversationKey];
          }
          resolve({
            conversationKey: conversationKey,
            conversationObj: conversationObj,
            conversationList: conversationList,
          });
          this.ref.detectChanges()
        })
        .catch((error: any) => reject(error));
    });
    return promise;
  }
  /**
   * Updates Conversation View when message is edited or deleted
   */
  conversationEditedDeleted(message: CometChat.BaseMessage) {
    try {
      this.makeConversation(message)
        .then((response: any) => {
          const conversationKey = response.conversationKey;
          const conversationObj: CometChat.Conversation = response.conversationObj;
          const conversationList = response.conversationList;
          if (conversationKey > -1) {
            let lastMessageObj: CometChat.BaseMessage = conversationObj.getLastMessage();
            if (lastMessageObj.getId() === message.getId()) {
              conversationObj.setLastMessage(message);
              (conversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx());
              conversationList.splice(conversationKey, 1, conversationObj);
              this.conversationList = [...conversationList];
              this.ref.detectChanges()
            }
          }
        })
        .catch((error: any) => {
          if(this.onError){
            this.onError(error)
          }
          this.ref.detectChanges()
        });
    } catch (error:any) {
            if(this.onError){
        this.onError(error)
      }
    }
  }
  /**
   * If User scrolls to the bottom of the current Conversation list than fetch next items of the Conversation list and append
   * @param Event
   */
  /**
   * Plays Audio When Message is Received
   */
  playAudio() {
    try {
      if(!this.disableSoundForMessages){
        if(this.customSoundForMessages){
          CometChatSoundManager.play(this.customSoundForMessages)
        }
        else{
          CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessageFromOther)
        }
      }
      else{
        return
      }
    } catch (error: any) {
            if(this.onError){
        this.onError(error)
      }
    }
  }
  /*
   * Updates the convesation list when deleted.
   * Adding Conversation Object to CometchatService
   */
  /**
   * @param  {CometChat.Conversation|{}} conversation
   */
  updateConversationList(conversation: CometChat.Conversation | null) {
    let index = this.conversationList.findIndex((element: CometChat.Conversation) => element?.getConversationId() == conversation?.getConversationId());
    this.conversationList.splice(index, 1);
    this.ref.detectChanges()
  }
  /**
   * showing dialog for confirm and cancel
   * @param  {CometChat.Conversation|{}} conversation
   */
  showConfirmationDialog = (conversation: CometChat.Conversation) => {
    this.isDialogOpen = true;
    this.conversationToBeDeleted = conversation;
    this.ref.detectChanges()
  }
  onOptionClick(event:any,conversation: CometChat.Conversation){
    let option:CometChatOption = event?.detail?.data
    this.conversationToBeDeleted = conversation;
    if(option){
      option.onClick!()
    }
  }
  /**
   * show confirm dialog screen
   * @param  {CometChat.Conversation|{}} conversaton
   */
  // check is there is any active conversation and mark it as active
  getActiveConversation(conversation: CometChat.Conversation) {
    if(this.selectionMode == SelectionMode.none || !this.selectionMode ) {
      return this.activeConversation && (this.activeConversation as any)?.conversationId == (conversation as any)?.conversationId
    }
    else {
      return false
    }
  }
  /**
   * handle confirm dialog response
   * @param  {string} value
   */
  // calling cometchat.deleteConversation method
  deleteSelectedConversation(){
    if (this.conversationToBeDeleted) {
      if (this.activeConversation && this.activeConversation.getConversationId() == this.conversationToBeDeleted.getConversationId()) {
        this.activeConversation = null
      }
      let conversationWith;
      let conversationType = this.conversationToBeDeleted.getConversationType();
      if (conversationType === CometChatUIKitConstants.MessageReceiverType.user) {
        conversationWith = (this.conversationToBeDeleted.getConversationWith() as CometChat.User).getUid()
      }
      else {
        conversationWith = (this.conversationToBeDeleted.getConversationWith() as CometChat.Group).getGuid()
      }
      CometChat.deleteConversation(conversationWith, conversationType).then(
        deletedConversation => {
          CometChatConversationEvents.ccConversationDeleted.next(this.conversationToBeDeleted!)
          this.updateConversationList(this.conversationToBeDeleted)
          this.conversationToBeDeleted = null;
          this.ref.detectChanges()
        },
      );
      this.isDialogOpen = false
      this.ref.detectChanges()
    }
  }
  // exposed methods to users.
  updateLastMessage(message: CometChat.BaseMessage) {
    this.updateConversation(message);
  }
  removeConversation(conversation: CometChat.Conversation) {
    this.updateConversationList(conversation);
  }
  styles: any = {
    wrapperStyle: () => {
      return {
        height: this.conversationsStyle.height,
        width: this.conversationsStyle.width,
        border: this.conversationsStyle.border || `1px solid ${this.themeService.theme.palette.getAccent400()}`,
        borderRadius: this.conversationsStyle.borderRadius,
        background: this.conversationsStyle.background || this.themeService.theme.palette.getBackground(),
      }
    },
  }
  subtitleStyle = (conversation:any) => {
   if(this.typingIndicator && ( this.typingIndicator.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user && this.typingIndicator.getSender().getUid() == conversation.conversationWith?.uid || this.typingIndicator.getReceiverId() == conversation.conversationWith?.guid)){
      return {
        font: this.conversationsStyle.typingIndictorTextColor,
        color: this.conversationsStyle.typingIndictorTextColor
      }
   }
    return {
      font:    this.conversationsStyle.lastMessageTextFont,
      color:   this.conversationsStyle.lastMessageTextColor
    }
  }
  itemThreadIndicatorStyle = () => {
    return {
      textFont: this.conversationsStyle.threadIndicatorTextFont || fontHelper(this.themeService.theme.typography.caption2),
      textColor: this.conversationsStyle.threadIndicatorTextColor || this.themeService.theme.palette.getAccent400(),
    };
  }
}
