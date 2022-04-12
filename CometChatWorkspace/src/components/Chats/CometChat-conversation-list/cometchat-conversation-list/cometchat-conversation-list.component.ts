import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { INCOMING_OTHER_MESSAGE_SOUND } from "../../../../resources/audio/incomingOtherMessageSound";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";
import { CometChatService } from "./../../../../utils/cometchat.service";

@Component({
  selector: "cometchat-conversation-list",
  templateUrl: "./cometchat-conversation-list.component.html",
  styleUrls: ["./cometchat-conversation-list.component.css"],
})
export class CometChatConversationListComponent implements OnInit, OnChanges {
  @Input() item: any = null;
  @Input() type: string = '';
  @Input() lastMessage: object = {};
  @Output() onUserClick: EventEmitter<any> = new EventEmitter();
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  @Input() groupToUpdate: object = {};
  @Input() groupToDelete:object | null = null;

  decoratorMessage: string = COMETCHAT_CONSTANTS.LOADING_MESSSAGE;
  loggedInUser = null;
  conversationList = [];
  onItemClick = null;
  selectedConversation: any;
  ConversationListManager: object = {};
  checkItemChange: boolean = false;
  message = COMETCHAT_CONSTANTS.DELETE_CONVERSATION;
  confirmationButtonText = COMETCHAT_CONSTANTS.DELETE_BUTTON_TEXT;
  cancelButtonText = COMETCHAT_CONSTANTS.CANCEL_BUTTON_TEXT;
  showConfirmDialog: boolean = false;

  conversationRequest: any = null;
  conversationToBeDeleted : any = null;

  conversationListenerId = enums.CHAT_LIST_ + new Date().getTime();
  userListenerId = enums.CHAT_LIST_USER_ + new Date().getTime();
  groupListenerId = enums.CHAT_LIST_GROUP_ + new Date().getTime();
  callListenerId = enums.CHAT_LIST_CALL_ + new Date().getTime();

  CHATS: String = COMETCHAT_CONSTANTS.CHATS;

  constructor(private ref: ChangeDetectorRef, private CometChatService: CometChatService) {
    try {
      setInterval(() => {
        if (!this.ref.hasOwnProperty(enums.DESTROYED)) {
          this.ref.markForCheck();
        }
      }, 2000);
    } catch (error) {
      logger(error);
    }
  }

  ngOnDestroy() {
    try {
      this.removeListeners();
    } catch (error) {
      logger(error);
    }
  }

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.ITEM]) {
        this.checkItemChange = true;
        if (
          change[enums.ITEM].previousValue !==
            change[enums.ITEM].currentValue &&
          change[enums.ITEM].currentValue
        ) {
          if (Object.keys(change[enums.ITEM].currentValue).length === 0) {
            this.selectedConversation = {};
          } else {
            const conversationlist: any = [...this.conversationList];

            const conversationObj = conversationlist.find((c: any) => {
              if (
                (c.conversationType === this.type &&
                  this.type === CometChat.RECEIVER_TYPE.USER &&
                  c.conversationWith.uid === this.item.uid) ||
                (c.conversationType === this.type &&
                  this.type === CometChat.RECEIVER_TYPE.GROUP &&
                  c.conversationWith.guid === this.item.guid)
              ) {
                return c;
              }
              return false;
            });
            if (conversationObj) {
              let conversationKey = conversationlist.indexOf(conversationObj);
              let newConversationObj = {
                ...conversationObj,
                unreadMessageCount: 0,
              };
              conversationlist.splice(conversationKey, 1, newConversationObj);
              this.conversationList = conversationlist;
              this.selectedConversation = newConversationObj;
            }
          }

          // if user is blocked/unblocked, update conversationlist i.e user is removed from conversationList
          if (
            change[enums.ITEM].previousValue &&
            Object.keys(change[enums.ITEM].previousValue).length &&
            change[enums.ITEM].previousValue.uid ===
              change[enums.ITEM].currentValue.uid &&
            change[enums.ITEM].previousValue.blockedByMe !==
              change[enums.ITEM].currentValue.blockedByMe
          ) {
            let conversationlist = [...this.conversationList];

            //search for user
            let convKey = conversationlist.findIndex(
              (c: any, k) =>
                c.conversationType === CometChat.RECEIVER_TYPE.USER &&
                c.conversationWith.uid === change[enums.ITEM].currentValue.uid
            );
            if (convKey > -1) {
              conversationlist.splice(convKey, 1);
              this.conversationList = conversationlist;
            }
          }
        }
      }

      if (change[enums.GROUP_TO_UPDATE]) {
        let prevProps: any = { groupToUpdate: null };
        let props: any = { groupToUpdate: null };

        prevProps[enums.GROUP_TO_UPDATE] =
          change[enums.GROUP_TO_UPDATE].previousValue;
        props[enums.GROUP_TO_UPDATE] =
          change[enums.GROUP_TO_UPDATE].currentValue;

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
              scope: groupToUpdate[enums.SCOPE],
              membersCount: groupToUpdate[enums.MEMBERS_COUNT],
            });

            conversationList.splice(groupKey, 1, newGroupObj);

            this.conversationList = conversationList;
          }
        }
      }

      if (change[enums.GROUP_TO_DELETE]) {
        let prevProps: any = { groupToDelete: null };
        let props: any = { groupToDelete: null };

        prevProps[enums.GROUP_TO_DELETE] =
          change[enums.GROUP_TO_DELETE].previousValue;
        props[enums.GROUP_TO_DELETE] =
          change[enums.GROUP_TO_DELETE].currentValue;

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

            if (conversationList.length === 0) {
              this.decoratorMessage = COMETCHAT_CONSTANTS.NO_CHATS_FOUND;
            }
          }
        }
      }

      /**
       * When user sends message conversationList is updated with latest message
       */
      if (this.checkItemChange === false) {
        if (change[enums.LAST_MESSAGE]) {
          if (
            change[enums.LAST_MESSAGE].previousValue !==
              change[enums.LAST_MESSAGE].currentValue &&
            change[enums.LAST_MESSAGE].currentValue !== undefined
          ) {
            const lastMessage = Object.assign({}, change[enums.LAST_MESSAGE].currentValue);

            const conversationList: any = [...this.conversationList];
            const conversationKey = conversationList.findIndex((c: any) => {
              if (lastMessage === undefined) {
                return false;
              }
              return c.conversationId === lastMessage.conversationId;
            });

            if (conversationKey > -1) {
              const conversationObj: any = conversationList[conversationKey];
              let newConversationObj = {
                ...conversationObj,
                lastMessage: lastMessage,
              };

              conversationList.splice(conversationKey, 1);
              conversationList.unshift(newConversationObj);
              this.conversationList = conversationList;
            }
          }
        }
      }
      this.checkItemChange = false;
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.conversationRequest = new CometChat.ConversationsRequestBuilder()
        .setLimit(30)
        .build();
      this.getConversation();
      this.attachListeners(this.conversationUpdated);

    } catch (error) {
      logger(error);
    }

    /*
     * Deleting the selected conversation.
     */
    this.CometChatService.onConfirmDialogClick.subscribe((value: any) => {
      this.showConfirmDialog = false;
      if(value === "yes") {
        let conversationWith: any; 
        if(this.conversationToBeDeleted) {
          let conversationType = this.conversationToBeDeleted.conversationType;
          if(conversationType === CometChat.RECEIVER_TYPE.USER) {
            conversationWith = this.conversationToBeDeleted.conversationWith.uid;
          } else {
            conversationWith = this.conversationToBeDeleted.conversationWith.guid; 
          }

          CometChat.deleteConversation(conversationWith, conversationType).then(
          deletedConversation => { 
            this.updateConversationList(this.conversationToBeDeleted);
            this.conversationToBeDeleted = null;
          }, error => {
            console.log('error while deleting a conversation', error);
          });
          }
      } else {
        this.showConfirmDialog = false;
      }
    })

    /*
     * Updating the conversation list on leaving group.
     */
    this.CometChatService.onLeaveGroup.subscribe((group : any) => {
      this.conversationList.forEach((conversation: any , index) => {
        if(conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP && 
          conversation.conversationWith.guid === group.guid) {
          this.conversationList.splice(index, 1);
        }
      })
    })
  }

  /**
   * Fetches the coversation based on the conversationRequest config
   */
  fetchNextConversation() {
    try {
      return this.conversationRequest.fetchNext();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * attaches Listeners for user activity , group activities and calling
   * @param callback
   */
  attachListeners(callback: any) {
    try {
      CometChat.addUserListener(
        this.userListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: any) => {
            /* when someuser/friend comes online, user will be received here */
            callback(enums.USER_ONLINE, onlineUser);
          },
          onUserOffline: (offlineUser: any) => {
            /* when someuser/friend went offline, user will be received here */
            callback(enums.USER_OFFLINE, offlineUser);
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
            callback(enums.GROUP_MEMBER_SCOPE_CHANGED, changedGroup, message, {
              user: changedUser,
              scope: newScope,
            });
          },
          onGroupMemberKicked: (message: any, kickedUser: any, kickedBy: any, kickedFrom: any) => {
            callback(enums.GROUP_MEMBER_KICKED, kickedFrom, message, {
              user: kickedUser,
              hasJoined: false,
            });
          },
          onGroupMemberBanned: (message: any, bannedUser: any, bannedBy: any, bannedFrom: any) => {
            callback(enums.GROUP_MEMBER_BANNED, bannedFrom, message, {
              user: bannedUser,
            });
          },
          onGroupMemberUnbanned: (
            message: any,
            unbannedUser: any,
            unbannedBy: any,
            unbannedFrom: any
          ) => {
            callback(enums.GROUP_MEMBER_UNBANNED, unbannedFrom, message, {
              user: unbannedUser,
            });
          },
          onMemberAddedToGroup: (
            message: any,
            userAdded: any,
            userAddedBy: any,
            userAddedIn: any
          ) => {
            callback(enums.GROUP_MEMBER_ADDED, userAddedIn, message, {
              user: userAdded,
              hasJoined: true,
            });
          },
          onGroupMemberLeft: (message: any, leavingUser: any, group: any) => {
            callback(enums.GROUP_MEMBER_LEFT, group, message, {
              user: leavingUser,
            });
          },
          onGroupMemberJoined: (message: any, joinedUser: any, joinedGroup: any) => {
            callback(enums.GROUP_MEMBER_JOINED, joinedGroup, message, {
              user: joinedUser,
            });
          },
        })
      );

      CometChat.addMessageListener(
        this.conversationListenerId,
        new CometChat.MessageListener({
          onTextMessageReceived: (textMessage: object) => {
            callback(enums.TEXT_MESSAGE_RECEIVED, null, textMessage);
          },
          onMediaMessageReceived: (mediaMessage: object) => {
            callback(enums.MEDIA_MESSAGE_RECEIVED, null, mediaMessage);
          },
          onCustomMessageReceived: (customMessage: object) => {
            
            callback(enums.CUSTOM_MESSAGE_RECEIVED, null, customMessage);
          },
          onMessageDeleted: (deletedMessage: object) => {
            callback(enums.MESSAGE_DELETED, null, deletedMessage);
          },
          onMessageEdited: (editedMessage: object) => {
            callback(enums.MESSAGE_EDITED, null, editedMessage);
          },
        })
      );

      CometChat.addCallListener(
        this.callListenerId,
        new CometChat.CallListener({
          onIncomingCallReceived: (call: object) => {
            callback(enums.INCOMING_CALL_RECEIVED, null, call);
          },
          onIncomingCallCancelled: (call: object) => {
            callback(enums.INCOMING_CALL_CANCELLED, null, call);
          },
        })
      );
    } catch (error) {
      logger(error);
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Fetches Conversations Details with all the users
   */
  getConversation() {
    try {
      CometChat.getLoggedinUser()
        .then((user: any) => {
          this.loggedInUser = user;
          this.fetchNextConversation()
            .then((conversationList: []) => {
              conversationList.forEach((conversation: any) => {
                if (
                  this.type !== null &&
                  this.item !== null &&
                  this.type === conversation.conversationType
                ) {
                  if (
                    (conversation.conversationType ===
                      CometChat.RECEIVER_TYPE.USER &&
                      this.item.uid === conversation.conversationWith.uid) ||
                    (conversation.conversationType ===
                      CometChat.RECEIVER_TYPE.GROUP &&
                      this.item.guid === conversation.conversationWith.guid)
                  ) {
                    conversation.unreadMessageCount = 0;
                  }
                }
              });
              this.conversationList = [
                ...this.conversationList,
                ...conversationList,
              ];
              if (this.conversationList.length === 0) {
                this.decoratorMessage = COMETCHAT_CONSTANTS.NO_CHATS_FOUND;
              } else {
                this.decoratorMessage = "";
              }
            })
            .catch((error: any) => {
              this.decoratorMessage = COMETCHAT_CONSTANTS.ERROR;
              logger(
                "[CometChatConversationList] getConversations fetchNext error",
                error
              );
            });
        })
        .catch((error) => {
          this.decoratorMessage = COMETCHAT_CONSTANTS.ERROR;
          logger(
            "[CometChatConversationList] getConversations getLoggedInUser error",
            error
          );
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates the conversation list's last message , badgeCount , user presence based on activities propagated by listeners
   */
  conversationUpdated = (
    key:any,
    item = null,
    message: object,
    options = null
  ) => {
    try {
      switch (key) {
        case enums.USER_ONLINE:
        case enums.USER_OFFLINE: {
          this.updateUser(item);
          break;
        }
        case enums.TEXT_MESSAGE_RECEIVED:
        case enums.MEDIA_MESSAGE_RECEIVED:
        case enums.CUSTOM_MESSAGE_RECEIVED:
          this.markMessageAsDelivered(message);
          this.updateConversation(message);
          break;
        case enums.MESSAGE_EDITED:
        case enums.MESSAGE_DELETED:
          this.conversationEditedDeleted(message);
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  markMessageAsDelivered = (message: any) => {
		//if chat window is not open, mark message as delivered
		if ((this.item === null || this.item.uid !== message.sender.uid) 
		&& !message.hasOwnProperty("deliveredAt")) {
		  CometChat.markAsDelivered(message);
		}
	};

  /**
   * Updates Detail when user comes online/offline
   * @param
   */
  updateUser(user: any) {
    try {
      //when user updates
      const conversationlist: any = [...this.conversationList];

      //Gets the index of user which comes offline/online
      const conversationKey = conversationlist.findIndex(
        (conversationObj: any) =>
          conversationObj.conversationType === CometChat.RECEIVER_TYPE.USER &&
          conversationObj.conversationWith.uid === user.uid
      );
      if (conversationKey > -1) {
        let conversationObj = { ...conversationlist[conversationKey] as any };
        let conversationWithObj = {
          ...conversationObj.conversationWith ,
          status: user.getStatus(),
        };

        let newConversationObj = {
          ...conversationObj,
          conversationWith: conversationWithObj,
        };
        conversationlist.splice(conversationKey, 1, newConversationObj);

        this.conversationList = conversationlist;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   *
   * Gets the last message
   * @param conversation
   */
  makeLastMessage(message: object, conversation = {}) {
      const newMessage = Object.assign({}, message);
      return newMessage;
  }

  /**
   *
   * Updates Conversations as Text/Custom Messages are received
   * @param
   *
   */
  updateConversation(message: object, notification = true) {
    try {
      if((message as any).type == enums.CALL_TYPE_DIRECT){
        this.actionGenerated.emit({
          type:enums.CALL_TYPE_DIRECT,
          payLoad:message

        })
     
      }
      this.makeConversation(message)
        .then((response: any) => {
          const conversationKey = response.conversationKey;
          const conversationObj: any = response.conversationObj;
          const conversationList = response.conversationList;

          if (conversationKey > -1) {
            let unreadMessageCount = this.makeUnreadMessageCount(
              conversationObj
            );
            let lastMessageObj = this.makeLastMessage(message, conversationObj);
            let newConversationObj = {
              ...conversationObj,
              lastMessage: lastMessageObj,
              unreadMessageCount: unreadMessageCount,
            };

            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.conversationList = conversationList;

            if (notification) {
              this.playAudio();
            }
          } else {
            let unreadMessageCount = this.makeUnreadMessageCount();
            let lastMessageObj = this.makeLastMessage(message);
            let newConversationObj = {
              ...conversationObj,
              lastMessage: lastMessageObj,
              unreadMessageCount: unreadMessageCount,
            };
            conversationList.unshift(newConversationObj);
            this.conversationList = conversationList;

            if (notification) {
              this.playAudio();
            }
          }
        })
        .catch((error) => {
          logger(
            "This is an error in converting message to conversation",
            error
          );
        });
    } catch (error) {
      logger(error);
    }
  }
  /**
   *
   * Gets The Count of Unread Messages
   * @param
   */
  makeUnreadMessageCount(conversation: any = {}, operator = null) {
      if (Object.keys(conversation).length === 0) {
        return 1;
      }

      let unreadMessageCount = parseInt(conversation.unreadMessageCount);
      if (
        this.selectedConversation &&
        this.selectedConversation.conversationId === conversation.conversationId
      ) {
        unreadMessageCount = 0;
      } else if (
        (this.item &&
          this.item.hasOwnProperty(enums.GUID) &&
          conversation.conversationWith.hasOwnProperty(enums.GUID) &&
          this.item.guid === conversation.conversationWith.guid) ||
        (this.item &&
          this.item.hasOwnProperty(enums.UID) &&
          conversation.conversationWith.hasOwnProperty(enums.UID) &&
          this.item.uid === conversation.conversationWith.uid)
      ) {
        unreadMessageCount = 0;
      } else {
        if (operator && operator === enums.DECREMENT) {
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
  makeConversation(message: object) {
      const promise = new Promise((resolve, reject) => {
        CometChat.CometChatHelper.getConversationFromMessage(message)
          .then((conversation: any) => {
            let conversationList = [...this.conversationList];
            let conversationKey = conversationList.findIndex(
              (c: any) => c.conversationId === conversation.conversationId
            );

            let conversationObj = { ...conversation };
            if (conversationKey > -1) {
              conversationObj = { ...conversationList[conversationKey] as {} };
            }

            resolve({
              conversationKey: conversationKey,
              conversationObj: conversationObj,
              conversationList: conversationList,
            });
          })
          .catch((error) => reject(error));
      });
      return promise;
  }

  /**
   * Updates Conversation View when message is edited or deleted
   */
  conversationEditedDeleted(message: any) {
    try {
      this.makeConversation(message)
        .then((response: any) => {
          const conversationKey = response.conversationKey;
          const conversationObj = response.conversationObj;
          const conversationList = response.conversationList;
          if (conversationKey > -1) {
            let lastMessageObj = conversationObj.lastMessage;

            if (lastMessageObj.id === message.id) {
              const newLastMessageObj = Object.assign(
                {},
                lastMessageObj,
                message
              );
              let newConversationObj = Object.assign({}, conversationObj, {
                lastMessage: newLastMessageObj,
              });
              conversationList.splice(conversationKey, 1, newConversationObj);
              this.conversationList = conversationList;
            }
          }
        })
        .catch((error) => {
          logger(
            "This is an error in converting message to conversation",
            error
          );
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * If User scrolls to the bottom of the current Conversation list than fetch next items of the Conversation list and append
   * @param Event e
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);
      if (bottom) {
        this.decoratorMessage = COMETCHAT_CONSTANTS.LOADING_MESSSAGE;
        this.getConversation();
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Emits User on User Click
   * @param user
   */
  userClicked(user: object) {
    try {
      this.onUserClick.emit(user);
    } catch (error) {
      logger(error);
    }
  }
  /**
   * Plays Audio When Message is Received
   */
  playAudio() {
    try {
      let audio = new Audio();
      audio.src = INCOMING_OTHER_MESSAGE_SOUND;
      audio.play();
    } catch (error) {
      logger(error);
    }
  }

  /*
   * Updates the convesation list when deleted.
   * Adding Conversation Object to CometchatService
   */ 
  updateConversationList(conversation: object) {
    let index = this.conversationList.findIndex((element) => element == conversation);
    this.conversationList.splice(index, 1);
    this.CometChatService.conversationDeleted.next(conversation);
  }

  showConfirmationDialog(conversation: object) {
    this.showConfirmDialog = true;
    this.conversationToBeDeleted = conversation;
  }
}
