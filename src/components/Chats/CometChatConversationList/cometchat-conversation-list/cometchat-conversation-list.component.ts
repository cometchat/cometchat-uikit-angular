import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import {CometChatSoundManager} from "../../../Shared/PrimaryComponents/CometChatSoundManager/cometchat-sound-manager/cometchat-sound-manager"
import * as types from "../../../Shared/Types/typesDeclairation"
import {ConversationListItemConfiguration} from "../../../Shared/PrimaryComponents/CometChatConfiguration/ConversationListItemConfiguration"
import {CometChatTheme, fontHelper} from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme"
import { style } from '../../interface'

import { CometChatConversationEvents } from "../../CometChatConversationEvents.service";
import { ConversationType, conversationConstants, callConstants, ConversationOption } from "../../../Shared/Constants/UIKitConstants";
import { getDefaultOptions } from "../../ConversationOptions/conversation-options";
import { popoverStyles } from "../../../Shared/UtilityComponents/CometChatPopover/interface";
import { ConversationInputData } from "../../../Shared/InputData/ConversationInputData";
import { customView } from "../../../Shared/Types/interface";
import { style as listItemStyle } from "../../../Shared/SDKDerivedComponents/listItemTypes/style";
import { localize } from "../../../Shared";
import { confirmDialogStyle } from "../../../Shared/UtilityComponents/CometChatConfirmDialog/interface";
  /**
 * 
 * CometChatConversationListComponent uses CometChatConversationListItemComponent,CometChatConfirmDialogComponent,CometChatBackDropComponent.
 *  this component renders recent chats list of user.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
@Component({
  selector: "cometchat-conversation-list",
  templateUrl: "./cometchat-conversation-list.component.html",
  styleUrls: ["./cometchat-conversation-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatConversationListComponent implements OnInit, OnChanges {
        /**
   * This properties will come from Parent.
   */
  @Input() limit: number = 30; 
  @Input() conversationType: types.conversationTypes = ConversationType.both; 
  @Input() userAndGroupTags: boolean = false; 
  @Input() tags: Array<string> = []; 
  @Input() style: style = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "",
    emptyStateTextFont:"",
    emptyStateTextColor:"",
    errorStateTextFont:"",
    errorStateTextColor:"",
    loadingIconTint: "",
  }; //consists of all styling properties 
  @Input() loadingIconURL: string = ""; 
  @Input() loggedInUser!: CometChat.User | null;
  @Input() customView!: customView; 
  @Input() errorText: string = localize("CANT__LOAD__CHATS");  
  @Input() emptyText: string = localize("NO_CHATS_FOUND") ; 
  @Input() hideError: boolean = false; 
  @Input() activeConversation: CometChat.Conversation | null = null; 
  @Input() conversationListItemConfiguration: ConversationListItemConfiguration = new ConversationListItemConfiguration({});
     /**
     * Properties for internal use
     */
  public isDialogOpen: boolean = false;
  @Input() theme: CometChatTheme = new CometChatTheme({});
  // public loggedInUser!: CometChat.User | null;
  public isEmpty: boolean = false;
  public isLoading: boolean = true;
  public isError: boolean = false;
  public decorateMessage: string =  conversationConstants.LOADING ;
  public conversationList: CometChat.Conversation[] = [];
  public scrolledToBottom: boolean = false;
  public checkItemChange: boolean = false;
  public confirmationButtonText: string = conversationConstants.DELETE_BUTTON;
  public cancelButtonText: string = conversationConstants.CANCEL_BUTTON;
  public confirmDialogMessage: string = conversationConstants.DELETE_CONVERSATION;
  public showConfirmDialog: boolean = false;
  public conversationRequest: CometChat.ConversationsRequestBuilder | null = null;
  public conversationToBeDeleted: CometChat.Conversation | null = null;
  public conversationListenerId: string = conversationConstants.CHAT_LIST_ + new Date().getTime();
  public userListenerId: string = conversationConstants.CHAT_LIST_USER_ + new Date().getTime();
  public groupListenerId: string = conversationConstants.CHAT_LIST_GROUP_ + new Date().getTime();
  public callListenerId: string = conversationConstants.CHAT_LIST_CALL_ + new Date().getTime();
  public CHATS: String = conversationConstants.CHATS;
  public groupToUpdate: CometChat.Group | {} = {};
  public confirmDialogStyle: confirmDialogStyle = {
    height:"100%",
    width:"100%",
    borderRadius:"8px"
  }
  // subscribers property
  public UpdateLastMessageSubscriber: any = null;
  // object for listItemComponent;
  public showTypingIndicator: boolean = true;
  public hideThreadIndicator: boolean = true;
  public hideReceipt!: boolean;
  public popOverStyle:popoverStyles = {
    width:"360px",
    height:"292px",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    position:"fixed",
    borderRadius:"8px"

  }
  /**
   * passing this callback to menuList component on delete click
   * @param  {CometChat.Conversation} conversation
   */
  deleteConversationOnClick: Function = (conversation: CometChat.Conversation): void => {
    this.deleteConversation(conversation)
  }
  // callback for confirmDialogComponent
  onConfirmClick = () => {
    return new Promise((resolve, reject) => {
      this.deleteSelectedConversation();

    })
  
  }
  // callback for confirmDialogComponent
  onCancelClick = () => {
    this.isDialogOpen = false
    this.conversationToBeDeleted = null
  }
  conversationOptions!:  any;
  listItemData: ConversationInputData = {};
  listItemStyle: listItemStyle = {
    titleFont: "",
    titleColor: "",
    subTitleColor: "",
    subTitleFont: "",
    typingIndicatorTextColor: "",
    typingIndicatorTextFont: "",
    threadIndicatorTextColor: "",
    threadIndicatorTextFont: "",
    activeBackground:""
  }
  typingIndicator: string = conversationConstants.IS_TYPING;
  threadIndicator: string = conversationConstants.IN_A_THREAD;
  isActive: boolean = true;
  contactsNotFound: boolean = false;
  timeout!: any;
  chatSearch!: boolean;
  constructor(private ref: ChangeDetectorRef, private conversationEvents: CometChatConversationEvents) {

  }

  ngOnInit() {
    this.setConversationOptions();
    this.setThemeStyle();
    this.checkConfiguration();
    this.subscribeToEvents();
    try {
      switch (this.conversationType) {
        case ConversationType.users:
          (this.conversationRequest as any) = new CometChat.ConversationsRequestBuilder().setTags(this.tags).withUserAndGroupTags(this.userAndGroupTags).setConversationType(CometChat.ACTION_TYPE.TYPE_USER).setLimit(this.limit).build();
          break;
        case ConversationType.groups:
          (this.conversationRequest as any) = new CometChat.ConversationsRequestBuilder().setTags(this.tags).withUserAndGroupTags(this.userAndGroupTags).setConversationType(CometChat.ACTION_TYPE.TYPE_GROUP).setLimit(this.limit).build();
          break;
        default:
          (this.conversationRequest as any) = new CometChat.ConversationsRequestBuilder().setTags(this.tags).withUserAndGroupTags(this.userAndGroupTags).setLimit(this.limit).build();
          break;
      }
      this.getConversation();
      this.attachListeners(this.conversationUpdated);
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
    this.ref.detectChanges()
  }
  ngOnChanges(change: SimpleChanges) {
    
    try {
      if(change["theme"]){
        this.setThemeStyle()
      }
      if (change[conversationConstants.GROUP_TO_UPDATE]) {
        let prevProps: any = { groupToUpdate: null };
        let props: any = { groupToUpdate: null };
        prevProps[conversationConstants.GROUP_TO_UPDATE] =
          change[conversationConstants.GROUP_TO_UPDATE].previousValue;
        props[conversationConstants.GROUP_TO_UPDATE] =
          change[conversationConstants.GROUP_TO_UPDATE].currentValue;
        if (
          prevProps.groupToUpdate &&
          (prevProps.groupToUpdate.guid !== props.groupToUpdate.guid ||
            (prevProps.groupToUpdate.guid === props.groupToUpdate.guid &&
              (prevProps.groupToUpdate.membersCount !==
                props.groupToUpdate.membersCount ||
                prevProps.groupToUpdate.scope !== props.groupToUpdate.scope)))
        ) {
          const conversationList = [...this.conversationList];
          const groupToUpdate: any = this.groupToUpdate;
          const groupKey = conversationList.findIndex(
            (group: any) => group.conversationWith.guid === groupToUpdate.guid
          );
          if (groupKey > -1) {
            const groupObj = conversationList[groupKey];
            const newGroupObj = Object.assign({}, groupObj, groupToUpdate, {
              scope: groupToUpdate[conversationConstants.SCOPE],
              membersCount: groupToUpdate[conversationConstants.MEMBERS_COUNT],
            });
            conversationList.splice(groupKey, 1, newGroupObj);
            this.conversationList = conversationList;
          }
        }
      }
      if (change[conversationConstants.GROUP_TO_DELETE]) {
        let prevProps: any = { groupToDelete: null };
        let props: any = { groupToDelete: null };
        prevProps[conversationConstants.GROUP_TO_DELETE] =
          change[conversationConstants.GROUP_TO_DELETE].previousValue;
        props[conversationConstants.GROUP_TO_DELETE] =
          change[conversationConstants.GROUP_TO_DELETE].currentValue;
        if (
          prevProps.groupToDelete &&
          prevProps.groupToDelete.guid !== props.groupToDelete.guid
        ) {
          const conversationList = [...this.conversationList];
          const groupKey = conversationList.findIndex(
            (group: any) => group.conversationWith.guid === props.groupToDelete.guid
          );
          if (groupKey > -1) {
            conversationList.splice(groupKey, 1);
            this.conversationList = conversationList;
            if (conversationList.length === 0 && !this.hideError ) {
              this.decorateMessage = conversationConstants.NO_CHATS_FOUND;
              this.isLoading = false
              this.isError = false
              this.isEmpty = true
            }
          }
        }
      }
      /**
       * When user sends message conversationList is updated with latest message
       */
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
  }
  ngOnDestroy() {
    try {
      this.removeListeners();
      this.unsubscribeToEvents();
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
    this.ref.detectChanges()
  }
  // getting default conversation option and adding callback in it
  setConversationOptions(){
    this.conversationOptions = getDefaultOptions();
    this.conversationOptions.forEach((element: any) => {
      if(!element.callBack && element.id == ConversationOption.delete){
        element.callBack = this.deleteConversationOnClick
      }
    });
  }
  // subscribe to global events 
  subscribeToEvents() {
    this.UpdateLastMessageSubscriber = this.conversationEvents.updateLastMessage.subscribe((lastMessage: CometChat.BaseMessage) => {
      this.conversationUpdated(conversationConstants.LAST_MESSAGE, null, lastMessage)
      // this.ref.detectChanges()
    })
  }
  // reset unread count
  resetUnreadCount() {
    this.setUnreadCount()
  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
  // this.scrollEVentsSubscriber.unsubscribe();
    this.UpdateLastMessageSubscriber.unsubscribe()
  }
  onClick(conversation:CometChat.Conversation){
    this.conversationEvents.publishEvents(this.conversationEvents.onItemClick, conversation)
  }
  // set unread count
  setUnreadCount() {
    if (this.activeConversation) {
      const conversationlist: CometChat.Conversation[] = [...this.conversationList];
      //Gets the index of user which comes offline/online
      const conversationKey = conversationlist.findIndex(
        (conversationObj: CometChat.Conversation) =>
          conversationObj?.getConversationId() === this.activeConversation?.getConversationId()
      );
      if (conversationKey > -1) {
        let conversationObj:CometChat.Conversation = conversationlist[conversationKey];
        let newConversationObj:CometChat.Conversation =conversationObj
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
    this.listItemStyle.background = this.theme.palette.getBackground();
    this.listItemStyle.activeBackground = this.theme.palette.getAccent50();
    this.listItemStyle.titleFont = fontHelper(this.theme.typography.title2);
    this.listItemStyle.titleColor = this.theme.palette.getAccent();
    this.listItemStyle.subTitleFont = fontHelper(this.theme.typography.subtitle2);
    this.listItemStyle.subTitleColor = this.theme.palette.getAccent600();
    this.listItemStyle.typingIndicatorTextColor = this.theme.palette.getPrimary();
    this.listItemStyle.typingIndicatorTextFont = fontHelper(this.theme.typography.subtitle2);
    this.listItemStyle.threadIndicatorTextFont =  fontHelper(this.theme.typography.subtitle2);
    this.listItemStyle.threadIndicatorTextColor = this.theme.palette.getAccent400();
    this.confirmDialogStyle.confirmBackground = this.theme.palette.getError();
    this.confirmDialogStyle.cancelBackground = this.theme.palette.getAccent50();
    this.confirmDialogStyle.confirmTextColor = this.theme.palette.getAccent900("light");
    this.confirmDialogStyle.confirmTextFont = fontHelper(this.theme.typography.title2);
    this.confirmDialogStyle.cancelTextColor = this.theme.palette.getAccent900("dark");
    this.confirmDialogStyle.cancelTextFont = fontHelper(this.theme.typography.title2);
    this.confirmDialogStyle.titleFont = fontHelper(this.theme.typography.heading);
    this.confirmDialogStyle.titleColor = this.theme.palette.getAccent();
    this.confirmDialogStyle.subtitleFont = fontHelper(this.theme.typography.subtitle1);
    this.confirmDialogStyle.subtitleColor = this.theme.palette.getAccent600();
    this.confirmDialogStyle.background = this.theme.palette.getBackground();
  }
  // checking if user has his own configuration else will use default configuration
  checkConfiguration() {
      let defaultConfig = new ConversationListItemConfiguration({})
      this.setConversationListItemConfig(this.conversationListItemConfiguration, defaultConfig)
  
  }
  /**
   * @param  {Object={}} config
   * @param  {Object} defaultConfig?
   * @returns defaultConfig
   */
  setConversationListItemConfig(config: ConversationListItemConfiguration, defaultConfig: ConversationListItemConfiguration) {
    this.listItemData = config.InputData || defaultConfig.InputData;
    this.showTypingIndicator = config.hasOwnProperty("showTypingIndicator") ? config.showTypingIndicator : defaultConfig.showTypingIndicator
    this.hideThreadIndicator = config.hasOwnProperty("hideThreadIndicator") ? config.hideThreadIndicator : defaultConfig.hideThreadIndicator
    // this.conversationOptions = config.conversationOptions;
  }
    // calling subtitle callback from configurations
  /**
   * @param  {CometChat.Conversation} conversation
   */
  /**
   * Fetches the coversation based on the conversationRequest config
   */
  fetchNextConversation() {
    try {
      return (this.conversationRequest as any).fetchNext();
    } catch (error: any) {
      this.conversationEvents.publishEvents(this.conversationEvents.onError, error)
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
      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: object) => {
            /* when someuser/friend comes online, user will be received here */
            callback(conversationConstants.USER_ONLINE, onlineUser);
          },
          onUserOffline: (offlineUser: object) => {
            /* when someuser/friend went offline, user will be received here */
            callback(conversationConstants.USER_OFFLINE, offlineUser);
          },
        })
      );
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
            this.updateConversation(message)
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
          onTextMessageReceived: (textMessage: object) => {
            callback(conversationConstants.TEXT_MESSAGE_RECEIVED, null, textMessage);
          },
          onMediaMessageReceived: (mediaMessage: object) => {
            callback(conversationConstants.MEDIA_MESSAGE_RECEIVED, null, mediaMessage);
          },
          onCustomMessageReceived: (customMessage: object) => {
            callback(conversationConstants.CUSTOM_MESSAGE_RECEIVED, null, customMessage);
          },
          onMessagesRead: (messageReceipt: any) => {
            this.markAsRead(messageReceipt);
          },
          onMessageDeleted: (deletedMessage: object) => {
            callback(conversationConstants.MESSAGE_DELETED, null, deletedMessage);
          },
          onMessageEdited: (editedMessage: object) => {
            callback(conversationConstants.MESSAGE_EDITED, null, editedMessage);
          },
          onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
            this.updateDeliveredMessage(messageReceipt);
          },
        })
      );
      CometChat.addCallListener(
        this.callListenerId,
        new CometChat.CallListener({
          onIncomingCallReceived: (call: object) => {
            callback(callConstants.INCOMING_CALL_RECEIVED, null, call);
          },
          onIncomingCallCancelled: (call: object) => {
            callback(callConstants.INCOMING_CALL_CANCELLED, null, call);
          },
        })
      );
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError,error);
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
      CometChat.removeCallListener(this.callListenerId);
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
  }
  /**
   * Fetches Conversations Details with all the users
   */
  getConversation() {
    try {
      CometChat.getLoggedinUser()
        .then((user: CometChat.User | null) => {
          this.loggedInUser  = user;
          this.fetchNextConversation()
            .then((conversationList: CometChat.Conversation[]) => {
              this.isLoading = false
              conversationList.forEach((conversation: CometChat.Conversation) => {

               

                if (
                  this.activeConversation &&  this.activeConversation !== null &&
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
              this.ref.detectChanges()
            
              if (this.conversationList.length === 0  ) {
                this.decorateMessage = this.emptyText ? this.emptyText :   conversationConstants.NO_CHATS_FOUND;

                this.isError = false
                this.isEmpty = true
                // this.isLoading = false
              } else {
   
                this.isError = false
                this.isEmpty = false
                this.decorateMessage = "";
              }
              this.ref.detectChanges()
            })
            .catch((error: any) => {
                this.decorateMessage = this.errorText ? this.errorText :   conversationConstants.ERROR;
                this.isLoading = false
                this.isError = true
                this.isEmpty = false
              this.ref.detectChanges();
            });
        })
        .catch((error:any) => {
          this.decorateMessage = this.errorText ? this.errorText :   conversationConstants.ERROR;
          this.isLoading = false
            this.isError = true
            this.isEmpty = false
            this.ref.detectChanges();
        });
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
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
        case conversationConstants.USER_ONLINE:
        case conversationConstants.USER_OFFLINE: {
          this.updateUser(item);
          break;
        }
        case conversationConstants.MESSAGE_READ: {
          this.updateConversation(message, false)
          break;
        }
        case conversationConstants.MESSAGE_DELIVERED: {
          this.updateConversation(message, false)
          break;
        }
        case conversationConstants.TEXT_MESSAGE_RECEIVED:
        case conversationConstants.MEDIA_MESSAGE_RECEIVED:
        case conversationConstants.CUSTOM_MESSAGE_RECEIVED:
          this.markMessageAsDelivered(message);
          this.updateConversation(message);
          break;
        case conversationConstants.LAST_MESSAGE:
          if (this.loggedInUser?.getUid() == message.getSender().getUid() || this.loggedInUser?.getUid() != message.getReceiverId()) {
            this.updateConversation(message);
          }
          break;
        case conversationConstants.GROUP_MEMBER_ADDED:
        case conversationConstants.GROUP_MEMBER_BANNED:
        case conversationConstants.GROUP_MEMBER_JOINED:
        case conversationConstants.GROUP_MEMBER_KICKED:
        case conversationConstants.GROUP_MEMBER_LEFT:
        case conversationConstants.GROUP_MEMBER_UNBANNED:
        case conversationConstants.GROUP_MEMBER_SCOPE_CHANGED:
          this.updateConversation(message)
          break;
        case conversationConstants.MESSAGE_EDITED:
        case conversationConstants.MESSAGE_DELETED:
          this.conversationEditedDeleted(message);
          break;
      }
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
    // this.ref.detectChanges()
  };
  /**
   * @param  {CometChat.BaseMessage} message
   */
  markMessageAsDelivered = (message: CometChat.BaseMessage) => {
    //if chat window is not open, mark message as delivered
    if(this.activeConversation?.getConversationType() == CometChat.RECEIVER_TYPE.USER){
      if ((!this.activeConversation || (this.activeConversation?.getConversationWith() as CometChat.User)?.getUid() !== message?.getSender()?.getUid())
      && !message.hasOwnProperty("deliveredAt")) {
      CometChat.markAsDelivered(message)
    }

    }
    else{
      if ((!this.activeConversation || (this.activeConversation?.getConversationWith() as CometChat.Group)?.getGuid() !== message?.getReceiverId())
      && !message.hasOwnProperty("deliveredAt")) {
      CometChat.markAsDelivered(message)
    }
    }
 
  };
  // traceby method
  conversationId = (index: any, item: any)=> {
    // return item?.unreadMessageCount || item?.lastMessage?.readAt || (item?.lastMessage?.deliveredAt || item?.lastMessage?.readAt );
    return  item?.lastMessage?.muid || item?.lastMessage?.deliveredAt || item?.lastMessage?.readAt;
  }
  /**
   * @param  {CometChat.BaseMessage} readMessage
   */
  getUinx = ()=>{
    return String(Math.round(+new Date()/1000))
  }
  markAsRead(readMessage: CometChat.MessageReceipt) {
    let conversationlist:CometChat.Conversation[] = [...this.conversationList]
    const conversationKey = conversationlist.findIndex(
      (conversationObj: CometChat.Conversation) => (conversationObj.getLastMessage() as CometChat.TextMessage).getReceiverId() == readMessage.getSender().getUid()
    );
    if (conversationKey > -1) {
      let newConversationObject!:CometChat.Conversation;
      if (!(conversationlist[conversationKey].getLastMessage() as CometChat.TextMessage).getReadAt()) {
        newConversationObject  = conversationlist[conversationKey];
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
  updateUser(user: CometChat.User | CometChat.Group| null) {
    try {
      //when user updates
      const conversationlist: CometChat.Conversation[] = [...this.conversationList];
      //Gets the index of user which comes offline/online
      const conversationKey = conversationlist.findIndex(
        (conversationObj: CometChat.Conversation) =>
          conversationObj.getConversationType() === CometChat.RECEIVER_TYPE.USER &&
          (conversationObj.getConversationWith() as CometChat.User).getUid() === (user as CometChat.User).getUid()
      );
      if (conversationKey > -1) {
        let conversationObj:CometChat.Conversation = conversationlist[conversationKey];
        let conversationWithObj:CometChat.User = (conversationObj.getConversationWith() as CometChat.User)
        conversationWithObj.setStatus((user as CometChat.User).getStatus())
        let newConversationObj:CometChat.Conversation = conversationObj
        newConversationObj.setConversationWith(conversationWithObj);
        (newConversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx())
        conversationlist.splice(conversationKey, 1, newConversationObj);
        this.conversationList = conversationlist;
        this.ref.detectChanges()
      }
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
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
            let lastMessageObj:CometChat.BaseMessage = this.makeLastMessage(message, conversationObj);
            let newConversationObj:CometChat.Conversation = conversationObj
            newConversationObj.setLastMessage(lastMessageObj);
            newConversationObj.setUnreadMessageCount(unreadMessageCount);
            (newConversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx())
            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.conversationList =   [...conversationList];
            if (notification && (this.loggedInUser as any)?.uid != (message as any)?.sender?.uid) {
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
            if (notification && (this.loggedInUser as any).uid != message.getSender().getUid()) {
              this.playAudio();
              this.ref.detectChanges()
            }
          }
          this.ref.detectChanges()
        })
        .catch((error:any) => {
          this.conversationEvents.publishEvents(this.conversationEvents.onError, error)
          this.ref.detectChanges()
        });
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
    this.ref.detectChanges()
  }
  updateDeliveredMessage(messageReceipt:CometChat.MessageReceipt){
    let conversationList:CometChat.Conversation[] = [...this.conversationList];
    let conversationKey:number = conversationList.findIndex(
      (c: CometChat.Conversation) => (c.getLastMessage() as CometChat.TextMessage).getId() == Number(messageReceipt.getMessageId())
    );
    let conversationObj:CometChat.Conversation;
    if (conversationKey > -1) {
      conversationObj = conversationList[conversationKey];
      if(!(conversationObj.getLastMessage() as CometChat.TextMessage).getDeliveredAt()){
        (conversationObj.getLastMessage() as CometChat.TextMessage).setDeliveredAt(Number(this.getUinx()));
        (conversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx());
        conversationList.splice(conversationKey,1,conversationObj)
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
  makeUnreadMessageCount(conversation: any = {}, operator: any = null) {

    if (Object.keys(conversation).length === 0) {
      return 1;
    }
    let unreadMessageCount = parseInt(conversation.unreadMessageCount);
    if (
      this.activeConversation &&
      this.activeConversation.getConversationId() === conversation.getConversationId()
    ) {
      unreadMessageCount += 1;
    } else if (
      (this.activeConversation &&
        this.activeConversation.hasOwnProperty(conversationConstants.GUID) &&
        conversation.conversationWith.hasOwnProperty(conversationConstants.GUID) &&
        (this.activeConversation as any).guid === conversation.conversationWith.guid) ||
      (this.activeConversation &&
        this.activeConversation.hasOwnProperty(conversationConstants.UID) &&
        conversation.conversationWith.hasOwnProperty(conversationConstants.UID) &&
        (this.activeConversation as any).conversationWith.uid === conversation.conversationWith.uid)
    ) {

      unreadMessageCount = 0;
    } else {
      if (operator && operator === conversationConstants.DECREMENT) {
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
          let conversationList:CometChat.Conversation[] = [...this.conversationList];
          let conversationKey:number = conversationList.findIndex(
            (c: CometChat.Conversation) => c?.getConversationId() === conversation.getConversationId()
          );
          let conversationObj:CometChat.Conversation = conversation ;
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
        .catch((error:any) => reject(error));
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
          const conversationObj:CometChat.Conversation = response.conversationObj;
          const conversationList = response.conversationList;
          if (conversationKey > -1) {
            let lastMessageObj:CometChat.BaseMessage = conversationObj.getLastMessage();
            if (lastMessageObj.getId() === message.getId()) {
              conversationObj.setLastMessage(message);
              (conversationObj.getLastMessage() as CometChat.TextMessage).setMuid(this.getUinx());
              conversationList.splice(conversationKey, 1, conversationObj);
              this.conversationList = [...conversationList];
              this.ref.detectChanges()
            }
          }
        })
        .catch((error:any) => {
          this.conversationEvents.publishEvents(this.conversationEvents.onError, error)
          this.ref.detectChanges()
        });
    } catch (error) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
  }
  /**
   * If User scrolls to the bottom of the current Conversation list than fetch next items of the Conversation list and append
   * @param Event 
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);
      if (bottom && !this.hideError) {
        this.decorateMessage = conversationConstants.LOADING;
        this.isLoading = true
        this.isError = false
        this.isEmpty = false
        this.getConversation();
      }
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
  }
  /**
   * Plays Audio When Message is Received
   */
  playAudio() {
    try {
      CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessageFromOther)
    } catch (error:any) {
         this.conversationEvents.publishEvents(this.conversationEvents.onError, error);
    }
  }
  /*
   * Updates the convesation list when deleted.
   * Adding Conversation Object to CometchatService
   */
  /**
   * @param  {CometChat.Conversation|{}} conversation
   */
  updateConversationList(conversation: CometChat.Conversation | null | {} = {}) {
    let index = this.conversationList.findIndex((element: CometChat.Conversation) => (element as any).conversationId == (conversation as any).conversationId);
    this.conversationList.splice(index, 1);
    this.ref.detectChanges()
  
  }
  /**
   * showing dialog for confirm and cancel
   * @param  {CometChat.Conversation|{}} conversation
   */
  showConfirmationDialog(conversation: CometChat.Conversation | {}) {
    this.isDialogOpen = true;
    (this.conversationToBeDeleted as any) = conversation;
    this.ref.detectChanges()
  }
  /**
   * show confirm dialog screen
   * @param  {CometChat.Conversation|{}} conversaton
   */
  // check is there is any active conversation and mark it as active
  IsConversationActive(conversation: CometChat.Conversation) {
    let isActive: boolean = this.activeConversation && (this.activeConversation as any)?.conversationId == (conversation as any)?.conversationId ? true : false
    return isActive
  }
  /**
   * handle confirm dialog response
   * @param  {string} value
   */

  // calling dcometchat.deleteConversation method
  deleteSelectedConversation = ()=> {
    return new Promise((resolve, reject) => {
      if (this.conversationToBeDeleted) {
        if (this.activeConversation && this.activeConversation.getConversationId() == this.conversationToBeDeleted.getConversationId()) {
          this.activeConversation = null
        }
        let conversationWith;
        let conversationType = this.conversationToBeDeleted.getConversationType();
        if (conversationType === CometChat.RECEIVER_TYPE.USER) {
          conversationWith = (this.conversationToBeDeleted.getConversationWith() as CometChat.User).getUid()
        }
        else {
          conversationWith = (this.conversationToBeDeleted.getConversationWith() as CometChat.Group).getGuid()
        }
        CometChat.deleteConversation(conversationWith, conversationType).then(
          deletedConversation => {
            resolve(deletedConversation)
            this.conversationEvents.publishEvents(this.conversationEvents.onDeleteConversation, this.conversationToBeDeleted)
            this.updateConversationList(this.conversationToBeDeleted)
            this.conversationToBeDeleted = null;
            this.ref.detectChanges()
          }, error => {
            reject(error)
          }
        );
        this.isDialogOpen = false
        this.ref.detectChanges()
      }
    });
    
  

 

  }
  // this object contains dynamic stylings for this component
  conversationListStyles = {
    chatsListStyle: (style: style) => {
      return {
        height: style.height,
        background: style.background || this.theme.palette.getBackground() ,
      };
    },
    messageContainerStyle: (style: any) => {
      return {
        width: style.width,
      };
    },
    errorStyle: (style: style) => {
      return {
        font: style.errorStateTextFont || fontHelper(this.theme.typography.heading),
        color: style.errorStateTextColor || this.theme.palette.getAccent400(),
      }
    },
    emptyStyle: (style: style) => {
      return {
        font: style.emptyStateTextFont || fontHelper(this.theme.typography.heading),
        color: style.emptyStateTextColor || this.theme.palette.getAccent400(),
      }
    },
    loadingStyle: (style: style) => {
      return {
        WebkitMask: `url(${this.loadingIconURL})`,
        background: style.loadingIconTint || this.theme.palette.getAccent400(),
      }
    }
  }
  // exposed methods to users.
  updateLastMessage(message: CometChat.BaseMessage) {
    this.updateConversation(message);
  }
  removeConversation(conversation: CometChat.Conversation) {
    this.updateConversationList(conversation);
  }
  deleteConversation(conversaton: CometChat.Conversation) {
    this.showConfirmationDialog(conversaton);
  }
}
