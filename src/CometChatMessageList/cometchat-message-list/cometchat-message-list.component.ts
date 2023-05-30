import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  Renderer2,
  ApplicationRef,
  NgZone,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import {  Subscription } from "rxjs";
import {DateStyle,AvatarStyle, MenuListStyle, ReceiptStyle, BaseStyle, DocumentBubbleStyle, ConfirmDialogStyle, FullScreenViewerStyle} from 'my-cstom-package-lit'
import { CometChatThemeService } from "../../CometChatTheme.service";
import { States, localize, MessageListAlignment, DatePatterns, TimestampAlignment, CometChatMessageTemplate, DocumentIconAlignment,CometChatUIKitConstants, CometChatTheme, MessageBubbleAlignment, CometChatMessageOption, fontHelper, CometChatMessageEvents, MessageStatus, CometChatGroupEvents, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberScopeChanged, IGroupLeft, IMessages, CometChatUIEvents, Placement, IPanel, CometChatCallEvents } from "uikit-resources-lerna";
import { MessageListStyle, CometChatSoundManager, MessageReceiptUtils, CollaborativeWhiteboardConstants, CollaborativeDocumentConstants, MessageTranslationConstants, MessageTranslationStyle, ReactionsConstants, PollsBubbleStyle, ImageModerationStyle, SmartRepliesStyle, SmartRepliesConfiguration, SmartRepliesConstants, ThumbnailGenerationConstants, LinkPreviewConstants, CallscreenStyle, CallingDetailsUtils ,CometChatUIKitUtility, CometChatUIKitHelper} from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { StickersConstants,LinkPreviewStyle } from "uikit-utils-lerna";
import { Message } from "@angular/compiler/src/i18n/i18n_ast";


/**
*
* CometChatMessageList is a wrapper component for messageBubble
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-message-list",
  templateUrl: "./cometchat-message-list.component.html",
  styleUrls: ["./cometchat-message-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageListComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild("listScroll", { static: false }) listScroll!: ElementRef;
  @ViewChild("bottom", { static: false }) bottom!: ElementRef;
  @ViewChild("top", { static: false }) top!: ElementRef;
  @ViewChild("textBubble", { static: false }) textBubble!: TemplateRef<any>;
  @ViewChild("threadMessageBubble", { static: false }) threadMessageBubble!: TemplateRef<any>;
  @ViewChild("fileBubble", { static: false }) fileBubble!: TemplateRef<any>;
  @ViewChild("audioBubble", { static: false }) audioBubble!: TemplateRef<any>;
  @ViewChild("videoBubble", { static: false }) videoBubble!: TemplateRef<any>;
  @ViewChild("imageBubble", { static: false }) imageBubble!: TemplateRef<any>;
  @ViewChild("stickerBubble", { static: false }) stickerBubble!: TemplateRef<any>;
  @ViewChild("documentBubble", { static: false }) documentBubble!: TemplateRef<any>;
  @ViewChild("whiteboardBubble", { static: false }) whiteboardBubble!: TemplateRef<any>;
  @ViewChild("popoverRef", { static: false }) popoverRef!: any;
  @ViewChild("directCalling", { static: false }) directCalling!: TemplateRef<any>;
  @ViewChild("pollBubble", { static: false }) pollBubble!: TemplateRef<any>;


  @Input() hideError: boolean = false;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateView!: TemplateRef<any>;

  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() emptyStateText: string = localize("NO_MESSAGES_FOUND");
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() user!: CometChat.User;
  @Input() group!: CometChat.Group;
  @Input() disableReceipt: boolean = true;
  @Input() disableSoundForMessages: boolean = false;
  @Input() customSoundForMessages: string = "";
  @Input() readIcon: string = "assets/message-read.svg";
  @Input() deliveredIcon: string = "assets/message-delivered.svg";
  @Input() sentIcon: string = "assets/message-sent.svg";
  @Input() waitIcon: string = "assets/wait.svg";
  @Input() errorIcon: string = "assets/warning-small.svg"
  @Input() alignment: MessageListAlignment = MessageListAlignment.standard;
  @Input() showAvatar: boolean = true;
  @Input() datePattern: DatePatterns = DatePatterns.time;
  @Input() timestampAlignment: TimestampAlignment = TimestampAlignment.bottom;
  @Input() DateSeparatorPattern: DatePatterns = DatePatterns.DayDateTime;
  @Input() templates: CometChatMessageTemplate[] = [];
  @Input() messagesRequestBuilder!: CometChat.MessagesRequestBuilder;
  @Input() newMessageIndicatorText: string = "";
  @Input() scrollToBottomOnNewMessages: boolean = false;
  @Input() thresholdValue: number = 1000;
  @Input() onThreadRepliesClick!: ((message:CometChat.BaseMessage,view:TemplateRef<any>)=>void) | null;
  @Input() headerView!: TemplateRef<any>;
  @Input() footerView!: TemplateRef<any>;
  @Input() parentMessageId!: number;
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "28px",
    height: "28px",
  };
  @Input() backdropStyle :BaseStyle = {
    height:"100%",
    width:"100%",
    background:"rgba(0, 0, 0, 0.5)"
  }
  @Input() dateSeparatorStyle: DateStyle = {
    height: "",
    width: "",
  };
  @Input() messageListStyle: MessageListStyle = {
    nameTextFont: "600 15px Inter",
    nameTextColor: "white",
    TimestampTextFont: "",
    TimestampTextColor: "",
    threadReplySeparatorColor: "",
    threadReplyTextFont: "",
    threadReplyIconTint: "",
    threadReplyTextColor: "",
    emptyStateTextFont: "700 22px Inter",
    emptyStateTextColor: "#bcbcbc",
    errorStateTextFont: "700 22px Inter",
    errorStateTextColor: "#bcbcbc",
    loadingIconTint: "grey",
  };
  @Input() onError = (error:any)=>{
    console.log(error)
  }
  state: States = States.loading;
   optionsStyle: MenuListStyle = {
    width: "",
    height: "",
    border: "1px solid #e8e8e8",
    borderRadius: "8px",
    background: "white",
    submenuWidth: "100%",
    submenuHeight: "100%",
    submenuBorder: "1px solid #e8e8e8",
    submenuBorderRadius: "8px",
    submenuBackground: "white",
    moreIconTint:"grey"
  };
  receiptStyle:ReceiptStyle = {
  }
  documentBubbleAlignment:DocumentIconAlignment = DocumentIconAlignment.right
  callBubbleAlignment:DocumentIconAlignment = DocumentIconAlignment.left
  imageModerationStyle:ImageModerationStyle = {}

  timestampEnum: typeof TimestampAlignment= TimestampAlignment;
  public chatChanged:boolean = true
  // public properties
  public requestBuilder: any;
  public closeImageModeration:any

  public timeStampColor: string = "";
  public timeStampFont: string = "";
  smartReplyStyle: SmartRepliesStyle = {
    width: "100%",
    height: "100%",
    border: "none",
  }
  public showSmartReply:boolean = false;
  ccHidePanel!:Subscription;
  ccShowPanel!:Subscription;
  smartReplyMessage:CometChat.BaseMessage | null = null;
  public enableSmartReply:boolean = false;
  smartReplyConfig!:SmartRepliesConfiguration;
  public timeStampBackground: string = "";
  linkPreviewStyle:LinkPreviewStyle = {}
  public unreadMessagesStyle = {
    height: "100%",
    width: "100%",
    background: "#3399FF",
    display: "flex",
    justifyContent: "center",
    buttonTextFont: "400 13px Inter",
    color: "white",
    border:"none",
    borderRadius:"12px"
  }
  public dividerStyle:BaseStyle = {
    height: "1px",
    width: "100%",
    background: "grey"
  }
  pollBubbleStyle:PollsBubbleStyle = {}
  labelStyle:any = {
    textFont:"400 11px Inter",
    textColor:"grey"
  }
  imageBubbleStyle:any = {
    height:"128px",
    width:"128px",
    border:"none",
    borderRadius:"0",
    background:"transparent"
  }
  messagesList: CometChat.BaseMessage[] = [];
  bubbleDateStyle:DateStyle = {
  }
  whiteboardIconURL:string = "assets/collaborativewhiteboard.svg";
  documentIconURL:string = "assets/collaborativedocument.svg";
  directCallIconURL:string = "assets/Video-call2x.svg";
  placeholderIconURL:string = "/assets/placeholder.png"
  downloadIconURL:string = "assets/download.svg"
  translationStyle:MessageTranslationStyle = {}
  documentBubbleStyle:DocumentBubbleStyle = {}
  callBubbleStyle:DocumentBubbleStyle = {}
   whiteboardTitle:string = localize("COLLABORATIVE_WHITEBOARD")
   whiteboardSubitle:string = localize("DRAW_WHITEBOARD_TOGETHER")
   whiteboardButtonText:string =  localize("OPEN_WHITEBOARD")
   documentTitle:string = localize("COLLABORATIVE_DOCUMENT")
   documentSubitle:string = localize("DRAW_DOCUMENT_TOGETHER")
   documentButtonText:string = localize("OPEN_DOCUMENT")
   joinCallButtonText:string = localize("JOIN")
  topObserver!:IntersectionObserver;
  bottomObserver!:IntersectionObserver;
  localize:typeof localize = localize
  reinitialized: boolean = false;
  MessageTypesConstant:typeof CometChatUIKitConstants.MessageTypes = CometChatUIKitConstants.MessageTypes
  callConstant: string = CometChatUIKitConstants.MessageCategory.call
  public typesMap: any = {
  }
  public messageTypesMap: any = {
  }
  theme: CometChatTheme = new CometChatTheme({})
  public msgListenerId = "message_"+ new Date().getTime();
  public groupListenerId = "group_"+ new Date().getTime();
  public callListenerId = "call_"+ new Date().getTime();
  public loggedInUser!: CometChat.User;
  public states: typeof States = States
  MessageCategory = CometChatUIKitConstants.MessageCategory;
  public numberOfTopScroll: number = 0;
  keepRecentMessages: boolean = true;
  messageTemplate: CometChatMessageTemplate[] = [];

  messageCount!: number;
  isOnBottom: boolean = false;
  UnreadCount: CometChat.BaseMessage[] = [];
  newMessageCount: number | string = 0;
  type: string = "";
  confirmText:string = localize("YES")
  cancelText:string = localize("NO")
  warningText:string = "Are you sure want to see unsafe content?"
  ccMessageDelete!: Subscription;
  ccMessageReact!: Subscription;
  ccMessageRead!: Subscription;
  public ccMessageEdit!: Subscription;
  public ccLiveReaction!: Subscription;
  public ccMessageSent!: Subscription;
  public ccMessageEdited!: Subscription;
  ccGroupMemberAdded!:Subscription;
  ccGroupLeft!:Subscription;
  ccGroupMemberJoined!:Subscription;
  ccGroupMemberKicked!:Subscription;
  ccGroupMemberBanned!:Subscription;
  ccOwnershipChanged!:Subscription;
  ccGroupDeleted!:Subscription;
  ccGroupCreated!:Subscription;
  public ccOutgoingCall!: Subscription;
  public ccCallRejected!: Subscription;
  public ccCallEnded!: Subscription;
  public ccCallAccepted!:Subscription;
  ccGroupMemberScopeChanged!:Subscription;
  public threadedAlignment:MessageBubbleAlignment = MessageBubbleAlignment.left
  openEmojiKeyboard:boolean = false;
  keyboardAlignment:string = Placement.right
  popoverStyle:any = {
    height:"330px",
    width:"325px",
  }
  videoBubbleStyle: BaseStyle = {
    height: "130px",
    width: "230px",
    border: "none",
    borderRadius: "8px",
    background: "transparent"
  }
  threadViewAlignment = MessageBubbleAlignment.left
  whiteboardURL: string | URL | undefined;
  enableDataMasking:boolean = false;
  enableThumbnailGeneration:boolean = false;
  enableLinkPreview:boolean = false
  enablePolls:boolean = false;
  enableReactions:boolean = false;
  enableImageModeration:boolean = false;
  enableStickers:boolean = false;
  enableWhiteboard:boolean = false
  enableDocument:boolean = false
  showOngoingCall: boolean = false;
  enableCalling:boolean = false;
  ongoingCallStyle: CallscreenStyle = {}
  sessionId: string = "";

  getThreadViewStyle(message:CometChat.BaseMessage){
    if((!message.getSender() || message.getSender().getUid() === this.loggedInUser?.getUid()) && message?.getType() == CometChatUIKitConstants.MessageTypes.text){
      return {
        height: "30px",
        width: "100%",
        border: "none",
        borderRadius: "0",
        background: "transparent",
        padding:"0 8px",
        buttonIconTint: this.themeService.theme.palette.getAccent600(),
        display: "flex",
        flexFlow: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        buttonTextColor: this.themeService.theme.palette.getAccent("dark")
      }
    }
    else{
      return {
        height: "30px",
        width: "100%",
        border: "none",
        borderRadius: "0",
        background: "transparent",
        padding:"0 8px",
        buttonIconTint:"grey",
        display: "flex",
        flexFlow: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        buttonTextColor: this.themeService.theme.palette.getPrimary()
      }
    }
      }
  closeIconURL:string = "assets/close2x.svg"
  threadOpenIcon:string = "assets/side-arrow.svg"
  confirmDialogStyle:ConfirmDialogStyle = {}
  public messageToReact:CometChat.BaseMessage | null = null;
  public limit:number = 30;
  types: string[] = [];
  categories: string[] = [];
  constructor(private ngZone: NgZone, private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.templates)
    try {
      if (changes[CometChatUIKitConstants.MessageReceiverType.user] || changes[CometChatUIKitConstants.MessageReceiverType.group]) {
        this.showEnabledExtensions()
        this.numberOfTopScroll = 0
        if(!this.loggedInUser){
          CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
            this.loggedInUser = user as CometChat.User
          })
        }
        this.messagesList = []
        if (this.user) {
          if (Object.keys(this.user).length > 1) {
            this.user = this.user;
            this.type = CometChatUIKitConstants.MessageReceiverType.user;
            this.createRequestBuilder();
          }
          else {
            CometChat.getUser(this.user)
              .then((user: CometChat.User) => {
                this.user = user;
                this.type = CometChatUIKitConstants.MessageReceiverType.user;
                this.createRequestBuilder();
              })
          }
        }
        else if (this.group) {
          if (Object.keys(this.group).length > 1) {
            this.group = this.group
            this.type = CometChatUIKitConstants.MessageReceiverType.group
            this.createRequestBuilder()
          }
          else {
            CometChat.getGroup(this.group)
              .then((group: CometChat.Group) => {
                this.group = group;
                this.type = CometChatUIKitConstants.MessageReceiverType.group;
                this.createRequestBuilder();
              })
          }
        }
        //Removing Previous Conversation Listeners
        CometChat.removeMessageListener(this.msgListenerId);
        CometChat.removeGroupListener(this.groupListenerId);
        CometChat.removeCallListener(this.callListenerId);
        this.msgListenerId = "message_"+ new Date().getTime();
        this.groupListenerId = "group_"+ new Date().getTime();
        this.callListenerId = "call_"+ new Date().getTime();
        // Attach MessageListeners for the new conversation
        this.addMessageEventListeners();
      }
    } catch (error:any) {
     if(this.onError){
      this.onError(error)
     }
    }
  }
  addReaction = (event:any)=>{
    let emoji = event?.detail?.id
    this.popoverRef.nativeElement.openContentView(event)
this.reactToMessages(emoji)

  }
  getCallBubbleTitle(message:CometChat.BaseMessage){
    if(!message.getSender() || message.getSender().getUid() == this.loggedInUser.getUid()){
      return localize("YOU_INITIATED_GROUP_CALL")
    }
    else {
      return `${message.getSender().getName()}  ${localize("INITIATED_GROUP_CALL")}`
    }

  }
  getCallActionMessage = (call:CometChat.Call) => {

	return CallingDetailsUtils.getCallStatus(call,this.loggedInUser)
	};
  reactToMessages(emoji:string) {
    let removeEmoji:boolean = false
    let reactionObject:any = {};
    let newMessageObject!:CometChat.TextMessage | null;
    let msgObject:any = this.messageToReact;
    const userObject:any = {};
    if(this.loggedInUser?.getAvatar()){
      userObject["avatar"] = this.loggedInUser?.getAvatar();
    }
    if(this.loggedInUser?.getName()){
      userObject["name"] = this.loggedInUser?.getName();
    }
    let uid:any = this.loggedInUser?.getUid();
    const emojiObject = {
      [emoji]: {
        [uid]: userObject,
      },
    };
    const reactionExtensionsData = CometChatUIKitUtility.checkMessageForExtensionsData(
      (this.messageToReact as CometChat.BaseMessage),
       "reactions"
      );
    if (reactionExtensionsData) {
      if (reactionExtensionsData[emoji]) {
        //if the reactions metadata has the selected emoji/reaction for the loggedin user
        if (reactionExtensionsData[emoji][uid]) {
          delete reactionExtensionsData[emoji];
          removeEmoji = true;
        } else {
          let data:any = msgObject["metadata"]["@injected"]["extensions"][
            "reactions"
          ];
          data[emoji][uid] = userObject
         reactionObject = {
          ...data,
        };
        }
      } else {
        if (!msgObject?.hasOwnProperty("metadata")) {
          msgObject["metadata"] = {};
        }
        if (!msgObject["metadata"].hasOwnProperty("@injected")) {
          msgObject["metadata"]["@injected"] = {};
        }
        if (
          !msgObject["metadata"]["@injected"].hasOwnProperty("extensions")
        ) {
          msgObject["metadata"]["@injected"]["extensions"] = {};
        }
        if (
          !msgObject["metadata"]["@injected"]["extensions"].hasOwnProperty(
            "reactions"
          )
        ) {
          msgObject["metadata"]["@injected"]["extensions"]["reactions"] = {};
        }
        let data:any = msgObject["metadata"]["@injected"]["extensions"]["reactions"];
        reactionObject = { ...data, ...emojiObject };
      }
    } else {
      if (!msgObject?.hasOwnProperty("metadata")) {
        msgObject["metadata"] = {};
      }
      if (!msgObject["metadata"].hasOwnProperty("@injected")) {
        msgObject["metadata"]["@injected"] = {};
      }
      if (
        !msgObject["metadata"]["@injected"].hasOwnProperty("extensions")
      ) {
        msgObject["metadata"]["@injected"]["extensions"] = {};
      }
      if (
        !msgObject["metadata"]["@injected"]["extensions"].hasOwnProperty(
          "reactions"
        )
      ) {
        msgObject["metadata"]["@injected"]["extensions"]["reactions"] = {};
      }
      reactionObject = {
        ...emojiObject,
      };
    }
    var metadataObject:any;
   if(removeEmoji){
     metadataObject = {
      ...msgObject["metadata"],
  };
   }
   else{
     metadataObject = {
      ...msgObject["metadata"],
      "@injected": {
        ...msgObject["metadata"]["@injected"],
        extensions: {
          ...msgObject["metadata"]["@injected"]["extensions"],
          reactions: {
            ...reactionObject,
          },
        },
      },
  };
   }
    newMessageObject = this.messageToReact as CometChat.TextMessage;
    newMessageObject.setMetadata(metadataObject)
    this.updateMessage(newMessageObject)
    try {
      CometChat.callExtension(ReactionsConstants.reactions, ReactionsConstants.post, ReactionsConstants.v1, {
        msgId: this.messageToReact?.getId(),
        emoji: emoji,
      })
        .then((response: any) => {


        })
        .catch((error:CometChat.CometChatException) => {

     console.log(error)
        });
    } catch (error:any) {
      console.log(error)

    }
  }
  ngOnDestroy(): void {
    this.unsubscribeToEvents()
    try {
      //Removing Message Listeners
      CometChat.removeMessageListener(this.msgListenerId);
      CometChat.removeGroupListener(this.groupListenerId);
      CometChat.removeCallListener(this.callListenerId);
    } catch (error:any) {
       if(this.onError){
this.onError(error);
}
    }
  }
  reactionsStyle(message:CometChat.BaseMessage){
    let sentByMe:boolean = !message?.getSender() || message.getSender().getUid() == this.loggedInUser?.getUid()
    let isLeftAligned:boolean = this.alignment == MessageListAlignment.left || !sentByMe || message?.getCategory() != CometChatUIKitConstants.MessageCategory.message

    if(isLeftAligned){
        return {
      height: "100%",
      width: "100%",
      border: "none",
      borderRadius: "0",
      background: "transparent",
      textFont: fontHelper(this.themeService.theme.typography.subtitle1),
      textColor: this.themeService.theme.palette.getAccent600(),
      activeTextColor:this.themeService.theme.palette.getAccent("dark"),
      activeTextFont:fontHelper(this.themeService.theme.typography.subtitle1),
      addReactionIconTint:this.themeService.theme.palette.getAccent600(),
      activeReactionBackground:this.themeService.theme.palette.getPrimary(),
      reactionBackground:"transparent",
      reactionBorder:`1px solid ${this.themeService.theme.palette.getAccent100()}`,
      reactionBorderRadius:"12px",
      addReactionIconBackground:this.themeService.theme.palette.getAccent100()

    }
    }
  else{
    return {
      height: "100%",
      width: "100%",
      border: "none",
      borderRadius: "0",
      background: "transparent",
      textFont:   fontHelper(this.themeService.theme.typography.caption1),
      textColor:  this.themeService.theme.palette.getAccent("dark"),
      activeTextColor:  this.themeService.theme.palette.getPrimary(),
      activeTextFont:  fontHelper(this.themeService.theme.typography.caption1),
      addReactionIconTint:  this.themeService.theme.palette.getAccent("dark"),
      activeReactionBackground:  this.themeService.theme.palette.getAccent("dark"),
      reactionBackground:  "transparent",
      reactionBorder:`1px solid ${this.themeService.theme.palette.getAccent100()}`,
      reactionBorderRadius:"12px",
      addReactionIconBackground:this.themeService.theme.palette.getAccent100("light")
    }
  }
  }
  showEmojiKeyboard =(id:number,event:any)=>{
    let message:CometChat.BaseMessage | false = this.getMessageById(id)
    if(message){
      this.messageToReact = message
     this.keyboardAlignment = message.getSender()?.getUid() == this.loggedInUser?.getUid() ? Placement.left : Placement.right
      this.ref.detectChanges()
      this.popoverRef.nativeElement.openContentView(event)


    }

  }

  setBubbleView = () => {
    this.messageTemplate.forEach((element: CometChatMessageTemplate) => {
      this.messageTypesMap[element.type] = element
    });
  }
  openThreadView = (message:CometChat.BaseMessage)=>{
    if(this.onThreadRepliesClick){
      this.onThreadRepliesClick(message, this.threadMessageBubble)
    }
  }
  threadCallback = (id:number)=>{
    let messageObject:any = this.getMessageById(id)
this.openThreadView(messageObject)
  }
  deleteCallback =(id:number)=>{
let messageObject:any = this.getMessageById(id)
this.deleteMessage(messageObject)
  }
  editCallback =(id:number)=>{
    let messageObject:any = this.getMessageById(id)
    this.onEditMessage(messageObject)
  }
  copyCallback =(id:number)=>{
    let messageObject:any = this.getMessageById(id)
    this.onCopyMessage(messageObject)
  }
  getMessageById(id:number){
    let messageKey = this.messagesList.findIndex(
      (m) => m.getId() === id
    );
    if(messageKey > -1){
      return this.messagesList[messageKey]
    }
    else {
      return false;
    }
  }
  isTranslated(message:CometChat.TextMessage):any{
    let translatedMessageObject:any = message
    if (translatedMessageObject && translatedMessageObject?.data?.metadata && translatedMessageObject?.data?.metadata[MessageTranslationConstants.translated_message]) {
      return translatedMessageObject.data.metadata[MessageTranslationConstants.translated_message];
    }
    else {
        return null
    }
  }
  updateTranslatedMessage = (translation: any) => {
    const receivedMessage = translation;
    const translatedText = receivedMessage.translations[0].message_translated;
    let messageList: CometChat.BaseMessage[] = [...this.messagesList];
    let messageKey = messageList.findIndex(
      (m) => m.getId() === receivedMessage.msgId
    );
    let data: any;
    if (messageKey > -1) {
      const messageObj: CometChat.BaseMessage = messageList[messageKey];
      if ((messageObj as CometChat.TextMessage).getMetadata()) {
        data = (messageObj as CometChat.TextMessage).getMetadata();
      }
      else {
        (messageObj as CometChat.TextMessage).setMetadata({})
        data = (messageObj as CometChat.TextMessage).getMetadata()
      }
      data[MessageTranslationConstants.translated_message] = translatedText;
      const newMessageObj: CometChat.TextMessage | CometChat.BaseMessage = messageObj;
      messageList.splice(messageKey, 1, newMessageObj);
      this.messagesList = [...messageList];
      this.ref.detectChanges();
    }
  }
  translateMessage = (id:number)=>{
    let message:CometChat.BaseMessage | false = this.getMessageById(id)
    if(message){
      CometChat.callExtension(MessageTranslationConstants.message_translation, MessageTranslationConstants.post, MessageTranslationConstants.v2_translate, {
        "msgId": message.getId(),
        "text": (message as CometChat.TextMessage).getText(),
        "languages": navigator.languages
      }).then((result:any) => {
        if(result?.translations[0]?.message_translated != (message as CometChat.TextMessage)?.getText()){
          this.updateTranslatedMessage(result);
          this.ref.detectChanges();
        }
        else{
          return
        }

        // Result of translations
      })
        .catch((error:any) => {
        });
    }
  }
  setOptionsCallback(options:CometChatMessageOption[]) {
      options?.forEach((element: CometChatMessageOption) => {

        switch (element.id) {
          case CometChatUIKitConstants.MessageOption.deleteMessage:
            if(!element.onClick){
              element.onClick = this.deleteCallback
            }
            break;
          case CometChatUIKitConstants.MessageOption.editMessage:
            if(!element.onClick){
              element.onClick = this.editCallback
            }
            break;
          case CometChatUIKitConstants.MessageOption.translateMessage:
            if(!element.onClick){
              element.onClick = this.translateMessage
            }
            break;
          case CometChatUIKitConstants.MessageOption.copyMessage:
            if(!element.onClick){
              element.onClick = this.copyCallback
            }
            break;
          case CometChatUIKitConstants.MessageOption.reactToMessage:
            if(!element.onClick){
              element.onClick = this.showEmojiKeyboard
            }
            break;
            case CometChatUIKitConstants.MessageOption.replyInThread:
              if(!element.onClick){
                element.onClick = this.threadCallback
              }
              break;
          default:
            break;
        }
      });
    return options
  }
    /**
   * send message options based on type
   * @param  {CometChat.BaseMessage} msgObject
   */
     setMessageOptions(msgObject: CometChat.BaseMessage): CometChatMessageOption[] {
      let options!:CometChatMessageOption[];
      if (this.messageTemplate && this.messageTemplate.length > 0 && !msgObject?.getDeletedAt()  && msgObject?.getType() != CometChatUIKitConstants.MessageTypes.groupMember) {

        this.messageTemplate.forEach((element: CometChatMessageTemplate) => {
          if (msgObject?.getId() && element.type == msgObject?.getType() && element?.options) {
           options = this.setOptionsCallback(element?.options(this.loggedInUser,msgObject,this.themeService.theme,this.group)) || []
          }
        });
      }
      else{
        options = []
      }
      return options
    }
  /**
     * passing style based on message object
     * @param  {CometChat.BaseMessage} messageObject
     */
  setMessageBubbleStyle(msg: CometChat.BaseMessage): BaseStyle {

    let style!: BaseStyle;
    if (msg?.getDeletedAt()) {
      style = {
        background: "transparent",
        border: `1px dashed ${this.themeService.theme.palette.getAccent400()}`,
        borderRadius: "12px",
      }
    }
    else if(msg?.getType() ==  CometChatUIKitConstants.calls.meeting && (!msg?.getSender() || msg?.getSender().getUid() == this.loggedInUser.getUid())){
      style = {
        background: this.themeService.theme.palette.getPrimary(),
        border: `none`,
        borderRadius: "12px",
      }

    }
    else if(this.getLinkPreview(msg as CometChat.TextMessage)){
      style = {
        borderRadius: "8px",
        background: this.themeService.theme.palette.getAccent100(),
      }
    }
    else if(msg?.getType() == StickersConstants.sticker){
      style = {
          background: "transparent",
          borderRadius: "12px",
      }
    }
    else if (!msg?.getDeletedAt() && msg?.getCategory() == CometChatUIKitConstants.MessageCategory.message && msg?.getType() == CometChatUIKitConstants.MessageTypes.text && (!msg?.getSender() || this.loggedInUser!.getUid() == msg?.getSender().getUid())) {
      style = {
        background: this.alignment == MessageListAlignment.left ? this.themeService.theme.palette.getAccent100() : this.themeService.theme.palette.getPrimary(),
        borderRadius: "12px",
      }
    }
    else if (!msg?.getDeletedAt() && msg?.getCategory() == CometChatUIKitConstants.MessageCategory.message && msg?.getType() == CometChatUIKitConstants.MessageTypes.audio) {
      style = {
        borderRadius: "",
        background: this.themeService.theme.palette.getAccent100(),
      }
    }
    else if (msg?.getType() == CometChatUIKitConstants.MessageTypes.groupMember || msg?.getCategory() == this.callConstant) {
      style = {
        background: "transparent",
        borderRadius: "12px",
        border: `1px solid ${this.themeService.theme.palette.getAccent100()}`
      }
    }
    else {
     if(msg?.getSender() && msg?.getSender().getUid() != this.loggedInUser.getUid()){
      style = {
        background: this.themeService.theme.palette.getAccent100(),
        borderRadius: "12px",
      }
     }
     else{
      style = {
        background: this.themeService.theme.palette.getAccent100(),
        borderRadius: "12px",
      }
     }
    }
    return style
  }
  getSessionId(message:CometChat.CustomMessage){
    let data:any = message.getData()
    return data?.customData?.sessionID
  }
  getWhiteboardDocument(message:CometChat.CustomMessage){
    try {
      if ( message?.getData()) {
        const data:any = message.getData();
        if (data?.metadata) {
          const metadata = data?.metadata;
          if (CometChatUIKitUtility.checkHasOwnProperty(metadata,"@injected")) {
            const injectedObject = metadata["@injected"];
            if (injectedObject?.extensions) {
              const extensionObject = injectedObject.extensions;
              return extensionObject[CollaborativeWhiteboardConstants.whiteboard] ?  extensionObject[CollaborativeWhiteboardConstants.whiteboard].board_url: extensionObject[CollaborativeDocumentConstants.document].document_url;
            }
          }
        }
      }
    } catch (error:any) {
      if(this.onError){
        this.onError(error)
      }
    }
  }
  openLinkURL(event:any){
    window.open(event?.detail?.url, '_blank')
  }
  getSticker(message:CometChat.CustomMessage) {
    try {
      let stickerData:any = null;
      if (
        CometChatUIKitUtility.checkHasOwnProperty(message,StickersConstants.data) &&
       CometChatUIKitUtility.checkHasOwnProperty( (message as CometChat.CustomMessage).getData(),StickersConstants.custom_data)
      ) {
        stickerData = (message as any).data.customData;
        if (CometChatUIKitUtility.checkHasOwnProperty(stickerData,StickersConstants.sticker_url)) {
          return stickerData.sticker_url;
        }
        else{
          return ""
        }
      }
      else{
        return ""
      }
    } catch (error:any) {
       if(this.onError){
         this.onError(error)
       }
    }
  }
  getContentView = (message: CometChat.BaseMessage): TemplateRef<any> | null => {
    if (this.messageTypesMap[message?.getType()] && this.messageTypesMap[message?.getType()]?.contentView) {
      return this.messageTypesMap[message?.getType()]?.contentView(message)
    }
    else {
      return message.getDeletedAt() ?  this.typesMap["text"] : this.typesMap[message?.getType()]
    }
  }
  getHeaderView(message: CometChat.BaseMessage): TemplateRef<any> | null{
    let view: TemplateRef<any> | null = null
    if (this.messageTypesMap[message?.getType()] && this.messageTypesMap[message?.getType()]?.headerView) {
      view = this.messageTypesMap[message?.getType()]?.headerView(message)
      return view
    }
    else {
      return null
    }
  }
  getFooterView(message: CometChat.BaseMessage): TemplateRef<any> | null {
    let view: TemplateRef<any> | null = null
    if (this.messageTypesMap[message?.getType()] && this.messageTypesMap[message?.getType()]?.footerView) {
      view = this.messageTypesMap[message?.getType()]?.footerView(message)
      return view;
    }
    else {
      return null;
    }
  }
  setBubbleAlignment = (message: CometChat.BaseMessage) => {
    let alignment:MessageBubbleAlignment = MessageBubbleAlignment.center
    if (this.alignment == MessageListAlignment.left) {
      alignment = MessageBubbleAlignment.left
    }
    else {
      if (message?.getType() == CometChatUIKitConstants.MessageTypes.groupMember || message.getCategory() == this.callConstant) {
        alignment = MessageBubbleAlignment.center
      }
      else if (!message?.getSender() || message?.getSender().getUid() == this.loggedInUser.getUid() && message?.getType() != CometChatUIKitConstants.MessageTypes.groupMember) {
        alignment = MessageBubbleAlignment.right
      }
      else {
        alignment = MessageBubbleAlignment.left
      }
    }
    return alignment
  }
  getCallBubbleStyle(message:CometChat.BaseMessage){
    const isLeftAligned = this.alignment == MessageListAlignment.left;
    const isUserSentMessage = !message?.getSender() || this.loggedInUser!.getUid() === message?.getSender().getUid();
    if(isUserSentMessage &&  !isLeftAligned){
      return {
        titleFont:  fontHelper(this.themeService.theme.typography.text2),
        titleColor:  this.themeService.theme.palette.getAccent("dark"),
        iconTint: this.themeService.theme.palette.getAccent("dark"),
        buttonTextFont: fontHelper(this.themeService.theme.typography.text2),
        buttonTextColor: this.themeService.theme.palette.getPrimary(),
        buttonBackground: this.themeService.theme.palette.getAccent("dark"),
        width:"240px"
      }

    }
    else{
      return {
        titleFont:  fontHelper(this.themeService.theme.typography.text2),
        titleColor:  this.themeService.theme.palette.getAccent(),
        iconTint:  this.themeService.theme.palette.getPrimary(),
        buttonTextFont: fontHelper(this.themeService.theme.typography.text2),
        buttonTextColor: this.themeService.theme.palette.getPrimary(),
        buttonBackground: this.themeService.theme.palette.getAccent("dark"),
        width:"240px"
      }
    }

  }
  getBubbleWrapper = (message: CometChat.BaseMessage): TemplateRef<any> | null => {
    let view: TemplateRef<any> | null;
    if (this.messageTypesMap && this.messageTypesMap[message?.getType()] && this.messageTypesMap[message?.getType()].bubbleView) {
      view = this.messageTypesMap[message?.getType()].bubbleView(message)
      return view
    }
    else {
      view = null
      return view
    }
  }
  getBubbleAlignment(message:CometChat.BaseMessage){
    return this.alignment == MessageListAlignment.left || (message.getSender() && message.getSender().getUid() != this.loggedInUser.getUid()) ? MessageBubbleAlignment.left : MessageBubbleAlignment.right
  }
  setTranslationStyle = (message: CometChat.BaseMessage)=>{
    const isLeftAligned = this.alignment !== MessageListAlignment.left;
    const isUserSentMessage = !message?.getSender() || this.loggedInUser!.getUid() === message?.getSender().getUid();
    if ( !isLeftAligned) {
      return new MessageTranslationStyle({
        translatedTextFont: fontHelper(this.themeService.theme.typography.text3),
        translatedTextColor: this.themeService.theme.palette.getAccent("light"),
        helpTextColor: this.themeService.theme.palette.getAccent700(),
        helpTextFont:fontHelper(this.themeService.theme.typography.caption2),
        background:"transparent"
      });
    }
   else{
   if (isUserSentMessage) {
      return new MessageTranslationStyle({
        translatedTextFont: fontHelper(this.themeService.theme.typography.text3),
        translatedTextColor: this.themeService.theme.palette.getAccent("dark"),
        helpTextColor:this.themeService.theme.palette.getAccent700("dark"),
        helpTextFont:fontHelper(this.themeService.theme.typography.caption2),
        background:"transparent"
      });
    }
    else{
      return new MessageTranslationStyle({
        translatedTextFont: fontHelper(this.themeService.theme.typography.text3),
        translatedTextColor: this.themeService.theme.palette.getAccent("light"),
        helpTextColor: this.themeService.theme.palette.getAccent700(),
        helpTextFont:fontHelper(this.themeService.theme.typography.caption2),
        background:"transparent"
      });
    }
   }
  }
  getCallTypeIcon(message:CometChat.BaseMessage){
    if (message.getType() == CometChatUIKitConstants.MessageTypes.audio) {
      return "assets/Audio-Call.svg"
    }
    else {
      return "assets/Video-call.svg"
    }
  }
  callStatusStyle(message: CometChat.BaseMessage){
    if(message.getCategory() == this.callConstant){
      return {
        buttonTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
        buttonTextColor: CallingDetailsUtils.isMissedCall(message as CometChat.Call, this.loggedInUser) ? this.themeService.theme.palette.getError() :  this.themeService.theme.palette.getAccent600(),
        borderRadius: "10px",
        border: CallingDetailsUtils.isMissedCall(message as CometChat.Call, this.loggedInUser) ? `1px solid RGBA(255, 59, 48, 0.2)` : `1px solid ${this.themeService.theme.palette.getAccent100()}`,
        buttonIconTint: CallingDetailsUtils.isMissedCall(message as CometChat.Call, this.loggedInUser) ? this.themeService.theme.palette.getError() : this.themeService.theme.palette.getAccent600(),
        background: "transparent",
        iconBackground:"transparent",
        padding:"2px 12px 2px 0",
        gap:"0",
        height:"25px",
        justifyContent:"center"
      };
    }
    else{
      return null
    }
  }
  setTextBubbleStyle = (message: CometChat.BaseMessage) => {
    const isDeleted = message.getDeletedAt();
    const isLeftAligned = this.alignment !== MessageListAlignment.left;
    const isTextMessage = message.getCategory() === CometChatUIKitConstants.MessageCategory.message && message?.getType() === CometChatUIKitConstants.MessageTypes.text;
    const isUserSentMessage = !message?.getSender() || this.loggedInUser!.getUid() === message?.getSender().getUid();
    const isGroupMemberMessage = message?.getType() === CometChatUIKitConstants.MessageTypes.groupMember;
    if(this.getLinkPreview(message as CometChat.TextMessage)){
      return {
        textFont: fontHelper(this.themeService.theme.typography.text3),
        textColor: this.themeService.theme.palette.getAccent()
      };
    }
    if (!isDeleted && isLeftAligned && isTextMessage && isUserSentMessage) {
      return {
        textFont: fontHelper(this.themeService.theme.typography.text3),
        textColor: this.themeService.theme.palette.getAccent900("light")
      };
    }
    if (!isDeleted && isLeftAligned && isTextMessage && !isUserSentMessage && !isGroupMemberMessage) {
      return {
        textFont: fontHelper(this.themeService.theme.typography.text3),
        textColor: this.themeService.theme.palette.getAccent()
      };
    }
    if (isGroupMemberMessage) {
      return {
        textFont: fontHelper(this.themeService.theme.typography.subtitle2),
        textColor: this.themeService.theme.palette.getAccent600()
      };
    }

    return {
      textFont: fontHelper(this.themeService.theme.typography.text2),
      textColor: this.themeService.theme.palette.getAccent400()
    };
  }
  setFileBubbleStyle(message:CometChat.BaseMessage):any{
    const isFileMessage = message.getCategory() === CometChatUIKitConstants.MessageCategory.message && message?.getType() === CometChatUIKitConstants.MessageTypes.file;
if(isFileMessage){
  return {
    titleFont: fontHelper(this.theme.typography.subtitle1),
    titleColor: this.themeService.theme.palette.getAccent(),
    subtitleFont: fontHelper(this.theme.typography.subtitle2),
    subtitleColor: this.themeService.theme.palette.getAccent600(),
    iconTint: this.themeService.theme.palette.getPrimary(),
  };
}
else{
  return
}
  }
  ngAfterViewInit() {
    this.ioBottom();
    this.ioTop();
    this.checkMessageTemplate()
  }
  startDirectCall =(sessionId:string) =>{
      this.sessionId = sessionId
      this.showOngoingCall = true;
      this.ref.detectChanges()

  }
  launchCollaborativeWhiteboardDocument =(url:string)=> {
    window.open(url, "", "fullscreen=yes, scrollbars=auto");
  }


    /**
   * Extracting  types and categories from template
   *
   */


  checkMessageTemplate(){
    this.typesMap = {
      text: this.textBubble,
      file: this.fileBubble,
      audio: this.audioBubble,
      video: this.videoBubble,
      image: this.imageBubble,
      groupMember: this.textBubble,
      extension_sticker:this.stickerBubble,
      extension_whiteboard:this.whiteboardBubble,
      extension_document:this.documentBubble,
      extension_poll:this.pollBubble,
      meeting:this.directCalling

    }
    this.setBubbleView()
  }
  getPollBubbleData(message:CometChat.CustomMessage, type?:string){
   let data:any =  message.getCustomData()
    if(type){
     return data[type]
    }
    else{
      return message.getSender().getUid()
    }
  }
  getThreadCount(message:CometChat.BaseMessage) {
    const replyCount = message?.getReplyCount() || 0;
    const suffix = replyCount === 1 ? localize("REPLY") : localize("REPLIES");
    return `${localize("VIEW")} ${replyCount} ${suffix}`;
  }
  showEnabledExtensions(){
    if (ChatConfigurator.names.includes('textmoderator')) {
      this.enableDataMasking = true
    }
    if (ChatConfigurator.names.includes('thumbnailgeneration')) {
      this.enableThumbnailGeneration = true
    }
    if (ChatConfigurator.names.includes('linkpreview')) {
      this.enableLinkPreview = true
    }
    if (ChatConfigurator.names.includes('polls')) {
      this.enablePolls = true
    }
    if (ChatConfigurator.names.includes('reactions')) {
      this.enableReactions = true
    }
    if (ChatConfigurator.names.includes('imagemoderation')) {
      this.enableImageModeration = true
    }
    if (ChatConfigurator.names.includes('stickers')) {
      this.enableStickers = true
    }
    if (ChatConfigurator.names.includes('collaborativewhiteboard')) {
      this.enableWhiteboard = true
    }
    if (ChatConfigurator.names.includes('collaborativedocument')) {
      this.enableDocument = true
    }
    if (ChatConfigurator.names.includes('calling')) {
      this.enableCalling = true
    }
  }

  public openConfirmDialog:boolean = false
  public openFullscreenView:boolean = false
  public imageurlToOpen:string = "";
  fullScreenViewerStyle:FullScreenViewerStyle = {
height:"100%",
width:"100%",
closeIconTint:"blue"
  }
  openImageInFullScreen(message:any){
    this.imageurlToOpen = message?.data?.attachments[0]?.url
    this.openFullscreenView = true
    this.ref.detectChanges()
  }
  closeImageInFullScreen(){
    this.imageurlToOpen = ""
    this.openFullscreenView = false
    this.ref.detectChanges()
  }
  openWarningDialog(event:any){
this.closeImageModeration = event?.detail?.onConfirm
this.openConfirmDialog = true;
this.ref.detectChanges()

  }
  onConfirmClick = ()=>{
    this.openConfirmDialog = false;
    if(this.closeImageModeration ){
      this.closeImageModeration ()
    }
    this.ref.detectChanges()
  }
  onCancelClick(){
    this.openConfirmDialog = false;
    this.ref.detectChanges()
  }
  getTextMessage(message: CometChat.TextMessage): string {
    const text = this.enableDataMasking ? CometChatUIKitUtility.getExtensionData(message) : null;
    return text?.trim()?.length > 0 ? text : message.getText();
  }
  getLinkPreview(message:CometChat.TextMessage):any{
    try {
      if (message?.getMetadata() && this.enableLinkPreview) {
        const metadata:any = message.getMetadata();
        const injectedObject = metadata[LinkPreviewConstants.injected];
        if (injectedObject && injectedObject?.extensions) {
          const extensionsObject = injectedObject.extensions;
          if (
            extensionsObject &&
            CometChatUIKitUtility.checkHasOwnProperty(extensionsObject,LinkPreviewConstants.link_preview)
          ) {
            const linkPreviewObject = extensionsObject[LinkPreviewConstants.link_preview];
            if (
              linkPreviewObject &&
              CometChatUIKitUtility.checkHasOwnProperty(linkPreviewObject, LinkPreviewConstants.links) &&
              linkPreviewObject[ LinkPreviewConstants.links].length
            ) {
              return linkPreviewObject[ LinkPreviewConstants.links][0]
            }
            else{
              return null
            }
          }
          else{
            return null
          }
        }
      }
      else{
        return null
      }
    } catch (error:any) {
       if(this.onError){
         this.onError(error)
       }
    }
  }
   getImageThumbnail(msg: CometChat.MediaMessage): string {
    const message:any = msg as CometChat.MediaMessage;
    let imageURL = "";
    if (this.enableThumbnailGeneration) {
      try {
        const metadata:any = message.getMetadata();
        const injectedObject = metadata?.[ThumbnailGenerationConstants.injected] as { extensions?: any };
        const extensionsObject = injectedObject?.extensions;
        const thumbnailGenerationObject = extensionsObject[ThumbnailGenerationConstants.thumbnail_generation];
        const imageToDownload = thumbnailGenerationObject?.url_small;
        if (imageToDownload) {
          imageURL = imageToDownload
        } else {
          imageURL = message?.data?.attachments ? message?.data?.attachments[0]?.url : "";
        }
      } catch (error) {
        if (this.onError) {
          this.onError(error);
        }
      }
    } else {
      imageURL = message?.data?.attachments ? message?.data?.attachments[0]?.url : "";
    }
    return imageURL;
  }
  getLinkPreviewDetails(key:string,message:CometChat.TextMessage):string{
    let linkPreviewObject:any = this.getLinkPreview(message)
    if(Object.keys(linkPreviewObject).length > 0){
      return linkPreviewObject[key]
    }
    else{
      return ""
    }
  }

  ngOnInit(): void {

    this.setMessagesStyle()
    this.setAvatarStyle()
    this.setDateStyle()
    this.setReceiptStyle()
    this.subscribeToEvents()
    this.setOngoingCallStyle()
    this.state = States.loading
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      this.loggedInUser = user as CometChat.User
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    this.dateSeparatorStyle.background =  this.dateSeparatorStyle.background  ||  this.themeService.theme.palette.getAccent600()
    this.dividerStyle.background = this.themeService.theme.palette.getAccent100()
  }
  setOngoingCallStyle = () => {
    let defaultStyle = new CallscreenStyle({
      maxHeight: "100%",
      maxWidth: "100%",
      border: "none",
      borderRadius: "0",
      background: "#1c2226",
      minHeight: "400px",
      minWidth: "400px",
      minimizeIconTint: this.themeService.theme.palette.getAccent900(),
      maximizeIconTint: this.themeService.theme.palette.getAccent900(),
    })
    this.ongoingCallStyle = { ...defaultStyle, ...this.ongoingCallStyle }
  }
  setAvatarStyle(){
    let defaultStyle:AvatarStyle = new AvatarStyle({
      borderRadius: "24px",
      width: "28px",
      height: "28px",
      border: "none",
      backgroundColor: this.themeService.theme.palette.getAccent700(),
      nameTextColor: this.themeService.theme.palette.getAccent900(),
      backgroundSize: "cover",
      nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      outerViewBorder: "",
      outerViewBorderSpacing: "",
    })
    this.avatarStyle = {...defaultStyle,...this.avatarStyle}
  }
setDateStyle(){
 let defaultStyle = new DateStyle({
  textFont: fontHelper(this.themeService.theme.typography.subtitle1),
  textColor: this.themeService.theme.palette.getAccent600(),
  background: this.themeService.theme.palette.getAccent100(),
  height: "100%",
  width: "100%",
  border: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
  borderRadius: "8px",
  })
  this.dateSeparatorStyle = {...defaultStyle,...this.dateSeparatorStyle}
}
  setMessagesStyle(){
    this.smartReplyStyle = {
      replyTextFont:fontHelper(this.themeService.theme.typography.caption1),
      replyTextColor:this.themeService.theme.palette.getAccent(),
      replyBackground:this.themeService.theme.palette.getBackground(),
      boxShadow:`0px 0px 1px ${this.themeService.theme.palette.getAccent600()}`,
      closeIconTint:this.themeService.theme.palette.getAccent600(),
      background:this.themeService.theme.palette.getBackground(),
      ...this.smartReplyStyle
    }
    this.fullScreenViewerStyle.closeIconTint = this.themeService.theme.palette.getPrimary()
    let defaultStyle:MessageListStyle = new MessageListStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`none`,
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      nameTextFont: fontHelper(this.themeService.theme.typography.title2),
      nameTextColor: this.themeService.theme.palette.getAccent600(),
      threadReplySeparatorColor: this.themeService.theme.palette.getAccent400(),
      threadReplyTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      threadReplyIconTint: this.themeService.theme.palette.getAccent600(),
      threadReplyTextColor: this.themeService.theme.palette.getAccent600(),
      TimestampTextFont: fontHelper(this.themeService.theme.typography.caption2),
      TimestampTextColor: this.themeService.theme.palette.getAccent600(),
    })
    this.messageListStyle = {...defaultStyle,...this.messageListStyle}
    this.bubbleDateStyle = {
      textColor: this.messageListStyle.TimestampTextColor || this.themeService.theme.palette.getAccent600(),
      textFont: this.messageListStyle.TimestampTextFont || fontHelper(this.themeService.theme.typography.caption2)
    }
    this.linkPreviewStyle =   new LinkPreviewStyle({
      titleColor: this.themeService.theme.palette.getAccent(),
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      descriptionColor: this.themeService.theme.palette.getAccent600(),
      descriptionFont: fontHelper(this.themeService.theme.typography.subtitle2),
      background: "transparent",
      height: "100%",
      width: "100%"
    })
    this.documentBubbleStyle = {
      titleFont:  fontHelper(this.themeService.theme.typography.text2),
      titleColor:  this.themeService.theme.palette.getAccent(),
      subtitleFont: fontHelper(this.themeService.theme.typography.subtitle2),
      subtitleColor:  this.themeService.theme.palette.getAccent600(),
      iconTint:  this.themeService.theme.palette.getAccent700(),
      buttonTextFont: fontHelper(this.themeService.theme.typography.text2),
      buttonTextColor: this.themeService.theme.palette.getPrimary(),
      buttonBackground: "transparent",
      separatorColor: this.themeService.theme.palette.getAccent200()
    }

    this.pollBubbleStyle = {
      borderRadius: "8px",
      background: "transparent",
      votePercentTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      votePercentTextColor: this.themeService.theme.palette.getAccent600(),
      pollQuestionTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      pollQuestionTextColor: this.themeService.theme.palette.getAccent(),
      pollOptionTextFont: fontHelper(this.themeService.theme.typography.text2),
      pollOptionTextColor: this.themeService.theme.palette.getAccent(),
      pollOptionBackground: this.themeService.theme.palette.getAccent900(),
      optionsIconTint: this.themeService.theme.palette.getAccent600(),
      totalVoteCountTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      totalVoteCountTextColor: this.themeService.theme.palette.getAccent600(),
      selectedPollOptionBackground: this.themeService.theme.palette.getAccent200(),
      userSelectedOptionBackground:this.themeService.theme.palette.getPrimary(),
      pollOptionBorder:`1px solid ${this.themeService.theme.palette.getAccent100()}`,
      pollOptionBorderRadius:"8px"
    }
    this.imageModerationStyle = {
      filterColor:this.themeService.theme.palette.getPrimary(),
      height:"100%",
      width:"100%",
      border:"none",
      warningTextColor:this.themeService.theme.palette.getAccent("dark"),
      warningTextFont:fontHelper(this.themeService.theme.typography.title2),
    }
    this.confirmDialogStyle = {
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
      width:"100%",
      border:`1px solid ${this.themeService.theme.palette.getAccent100()}`,
      borderRadius:"8px"
    }
  }
  setReceiptStyle(){
    this.receiptStyle = new ReceiptStyle({
waitIconTint:this.themeService.theme.palette.getAccent700(),
sentIconTint:this.themeService.theme.palette.getAccent600(),
deliveredIconTint:this.themeService.theme.palette.getAccent600(),
readIconTint:this.themeService.theme.palette.getPrimary(),
errorIconTint:this.themeService.theme.palette.getError(),
    })
    this.receiptStyle = {...this.receiptStyle}
  }
  createRequestBuilder(){
    if (!this.templates || this.templates?.length == 0) {
      this.messageTemplate = ChatConfigurator.getDataSource().getAllMessageTemplates()
      this.categories = ChatConfigurator.getDataSource().getAllMessageCategories()
      this.types = ChatConfigurator.getDataSource().getAllMessageTypes()
    }
    else {

      this.messageTemplate = this.templates
    }
    this.state = States.loading
    this.requestBuilder = null
    if (this.user || this.group) {
      if (!this.messagesRequestBuilder) {
        if (this.user) {
          this.requestBuilder = new CometChat.MessagesRequestBuilder()
            .setUID(this.user.getUid())
            .setLimit(this.limit)
            .setTypes(this.types)
            .setCategories(this.categories)
            .hideReplies(true)
            .build()
        }
        else {
          this.requestBuilder = new CometChat.MessagesRequestBuilder()
            .setGUID(this.group.getGuid())
            .setLimit(this.limit)
            .setTypes(this.types)
            .hideReplies(true)
            .setCategories(this.categories)
            .build()
        }
      }
      else {
        this.requestBuilder = this.messagesRequestBuilder.build()
      }
      this.fetchPreviousMessages();
    }
  }
  /**
 * Listener To Receive Messages in Real Time
 * @param
 */
  fetchPreviousMessages = () => {
    if (this.reinitialized) {
      if (this.messagesRequestBuilder) {
        this.requestBuilder = this.messagesRequestBuilder.setMessageId(this.messagesList[0].getId()).build()
      }
      else {
        if (this.user) {
          this.requestBuilder = new CometChat.MessagesRequestBuilder().setUID(this.user.getUid())
            .setLimit(this.limit)
            .setTypes(this.types)
            .setMessageId(this.messagesList[0].getId())
            .setCategories(this.categories)
            .hideReplies(true)
            .build()
        }
        else {
          this.requestBuilder = new CometChat.MessagesRequestBuilder().setGUID(this.group.getGuid())
            .setLimit(this.limit)
            .setTypes(this.types)
            .setMessageId(this.messagesList[0].getId())
            .setCategories(this.categories)
            .hideReplies(true)
            .build()
        }
      }
    }
    this.requestBuilder.fetchPrevious().then(
      (messageList: CometChat.BaseMessage[]) => {
        console.log(messageList)
        this.state = States.loading;
        // No Messages Found
        if (messageList.length === 0 && this.messagesList.length === 0) {
          this.state = States.empty;
           this.ref.detectChanges();
          return
        }
        if (messageList && messageList.length > 0) {
          let lastMessage = messageList[messageList.length - 1]
          if (lastMessage?.getSender().getUid() != this.loggedInUser?.getUid() && !lastMessage.getDeliveredAt()) {
            //mark the message as delivered
            if(!this.disableReceipt){
              CometChat.markAsDelivered(lastMessage).then((receipt:CometChat.MessageReceipt)=>{
                let messageKey = this.messagesList.findIndex((m: CometChat.BaseMessage) => m.getId() === Number(receipt?.getMessageId()));
                if (messageKey > -1) {
                    this.markAllMessagAsDelivered(messageKey)
                }
              })
             }
          }
          if (!lastMessage?.getReadAt()) {
            if (!this.disableReceipt) {
              CometChat.markAsRead(lastMessage).then((receipt:CometChat.MessageReceipt)=>{
                let messageKey = this.messagesList.findIndex((m: CometChat.BaseMessage) => m.getId() === Number(receipt?.getMessageId()));
                if (messageKey > -1) {
                    this.markAllMessagAsRead(messageKey)
                }
              }).catch((error:any)=>{
                if(this.onError){
                  this.onError(error)
                }
              })
            } else {
              this.UnreadCount = [];
                     this.ref.detectChanges();
            }
          }
          this.state = States.loaded
                 this.ref.detectChanges();
          //if the sender of the message is not the loggedin user, mark it as read.
            let prevScrollHeight = this.listScroll.nativeElement.scrollHeight;
            setTimeout(() => {
              this.listScroll.nativeElement.scrollTop =
                this.listScroll.nativeElement.scrollHeight - prevScrollHeight;
            });
            this.showSmartReply = false;
            this.smartReplyMessage = null;
            this.prependMessages(messageList)
        }
        else{
          this.state = States.loaded
        }
         this.ref.detectChanges();
      },
      (error: any) => {
        this.state = States.error;
        if(this.onError){
this.onError(error);
}
               this.ref.detectChanges();
      }
    ).catch((error: any) => {
      console.log(error)
      this.state = States.error;
             this.ref.detectChanges();
    })
  }
  fetchNextMessage = () => {
    let index = this.messagesList.length - 1
    if (this.reinitialized) {
      if (this.messagesRequestBuilder) {
        this.requestBuilder = this.messagesRequestBuilder.setMessageId(this.messagesList[index].getId()).build()
      }
      else {
        if (this.user) {
          this.requestBuilder = new CometChat.MessagesRequestBuilder().setUID(this.user.getUid())
            .setLimit(this.limit)
            .setTypes(this.types)
            .setMessageId(this.messagesList[index].getId())
            .setCategories(this.categories)
            .hideReplies(true)
            .build()
        }
        else {
          this.requestBuilder = new CometChat.MessagesRequestBuilder().setGUID(this.group.getGuid())
            .setLimit(this.limit)
            .setTypes(this.types)
            .setMessageId(this.messagesList[index].getId())
            .setCategories(this.categories)
            .hideReplies(true)
            .build()
        }
      }
      this.requestBuilder.fetchNext().then(
        (messageList: CometChat.BaseMessage[]) => {
          this.state = States.loading;
          // No Messages Found
          if (messageList.length === 0 && this.messagesList.length === 0) {
            this.state = States.empty;
                   this.ref.detectChanges();
            return
          }
          if (messageList && messageList.length) {
            let lastMessage = messageList[messageList.length - 1]
            if (!lastMessage?.getReadAt() && lastMessage?.getSender().getUid() != this.loggedInUser?.getUid()) {
              if (!this.disableReceipt) {
                CometChat.markAsRead(lastMessage);
              } else {
                this.UnreadCount = [];
                       this.ref.detectChanges();
              }
            }
            if(!lastMessage?.getDeliveredAt() && lastMessage?.getSender().getUid() != this.loggedInUser?.getUid()){
             this.markMessageAsDelivered(lastMessage)
             this.markAllMessagAsDelivered(messageList.length - 1)
            }
            this.state = States.loaded

              let prevScrollHeight = this.listScroll.nativeElement.scrollHeight;
              setTimeout(() => {
                this.listScroll.nativeElement.scrollTop =
                  this.listScroll.nativeElement.scrollHeight - prevScrollHeight;
              });
              this.appendMessages(messageList)
                   this.ref.detectChanges();
          }
        },
        (error: any) => {
          this.state = States.error;
          console.log(error)
          if(this.onError){
this.onError(error);
}
                 this.ref.detectChanges();
        }
      ).catch((error: any) => {
        console.log(error)
        this.state = States.error;
               this.ref.detectChanges();
      })
    }
  }
  appendMessages = (messages: CometChat.BaseMessage[]) => {
    this.messagesList.push(...messages)
    this.messageCount = this.messagesList.length;
    if (this.messageCount > this.thresholdValue) {
      this.keepRecentMessages = true
      this.reInitializeMessageBuilder();
    }
    this.state = States.loaded
    this.ref.detectChanges();
  }
  addMessageEventListeners() {
    try {
      CometChat.addMessageListener(
        this.msgListenerId,
        new CometChat.MessageListener({
          onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
            this.messageUpdate(CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED, textMessage);
          },
          onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
            this.messageUpdate(CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED, customMessage);
          },
          onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
            this.messageUpdate(CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED, mediaMessage);
          },
          onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
            this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_DELIVERED, messageReceipt);
          },
          onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
            this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_READ, messageReceipt);
          },
          onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
            this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_DELETED, deletedMessage);
          },
          onMessageEdited: (editedMessage: CometChat.BaseMessage) => {
            this.messageUpdate(CometChatUIKitConstants.messages.MESSAGE_EDITED, editedMessage);
          },
          onTransientMessageReceived: (transientMessage: CometChat.TransientMessage) => {
            let liveReaction: any = transientMessage.getData();
            if (transientMessage.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user && this.user && transientMessage?.getSender().getUid() == this.user.getUid() && transientMessage.getReceiverId() == this.loggedInUser?.getUid()) {
              CometChatMessageEvents.ccLiveReaction.next(liveReaction["LIVE_REACTION"])
              return;
            }
            else if (transientMessage.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.group && this.group && transientMessage.getReceiverId() == this.group.getGuid() && transientMessage?.getSender().getUid() != this.loggedInUser?.getUid()) {
              CometChatMessageEvents.ccLiveReaction.next(liveReaction["LIVE_REACTION"])
              return;
            }
          },
        })
      );
      CometChat.addGroupListener(
        this.groupListenerId,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            message: null | undefined,
            changedUser: CometChat.User,
            newScope: CometChat.GroupMemberScope,
            oldScope: CometChat.GroupMemberScope,
            changedGroup: null | undefined
          ) => {
            this.messageUpdate(
              CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE,
              message,
              changedGroup,
              { user: changedUser, scope: newScope }
            );
          },
          onGroupMemberKicked: (message: null | undefined, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: null | undefined) => {
            this.messageUpdate(
              CometChatUIKitConstants.groupMemberAction.KICKED,
              message,
              kickedFrom,
              {
                user: kickedUser,
                hasJoined: false,
              }
            );
          },
          onGroupMemberBanned: (message: null | undefined, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: null | undefined) => {
            this.messageUpdate(
              CometChatUIKitConstants.groupMemberAction.BANNED,
              message,
              bannedFrom,
              {
                user: bannedUser,
              }
            );
          },
          onGroupMemberUnbanned: (
            message: null | undefined,
            unbannedUser: CometChat.User,
            unbannedBy: CometChat.User,
            unbannedFrom: null | undefined
          ) => {
            this.messageUpdate(
              CometChatUIKitConstants.groupMemberAction.UNBANNED,
              message,
              unbannedFrom,
              { user: unbannedUser }
            );
          },
          onMemberAddedToGroup: (
            message: null | undefined,
            userAdded: CometChat.User,
            userAddedBy: CometChat.User,
            userAddedIn: null | undefined
          ) => {
            this.messageUpdate(
              CometChatUIKitConstants.groupMemberAction.ADDED,
              message,
              userAddedIn,
              {
                user: userAdded,
                hasJoined: true,
              }
            );
          },
          onGroupMemberLeft: (message: CometChat.BaseMessage, leavingUser: CometChat.GroupMember, group: CometChat.Group) => {
            this.messageUpdate(CometChatUIKitConstants.groupMemberAction.LEFT, message, group, {
              user: leavingUser,
            });
          },
          onGroupMemberJoined: (message: CometChat.BaseMessage, joinedUser: CometChat.GroupMember, joinedGroup: CometChat.Group) => {
            this.messageUpdate(
              CometChatUIKitConstants.groupMemberAction.JOINED,
              message,
              joinedGroup,
              {
                user: joinedUser,
              }
            );
          },
        })
      );
      if(this.enableCalling){
        CometChat.addCallListener(
          this.callListenerId,
          new CometChat.CallListener({
            onIncomingCallReceived: (call: CometChat.Call) => {
              this.addMessage(call)
            },
            onIncomingCallCancelled: (call: CometChat.Call) => {
              this.addMessage(call)
            },
            onOutgoingCallRejected: (call: CometChat.Call) => {
              this.addMessage(call)

            },
            onOutgoingCallAccepted: (call: CometChat.Call) => {
              this.addMessage(call)
            },

          })
        );
      }

    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
  }
  /**
*
* @param
*/
  /**
   * Updates messageList on basis of user activity or group activity or calling activity
   * @param  {any=null} key
   * @param  {CometChat.MessageReceipt | CometChat.BaseMessage} message
   * @param  {CometChat.Group | null=null} group
   * @param  {any=null} options
   */
  messageUpdate(key: string | null = null, message: CometChat.MessageReceipt | CometChat.BaseMessage | any = null, group: CometChat.Group | null = null, options: any = null) {
    try {
      switch (key) {
        case CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED:
        case CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED:
          this.messageReceived(message);
          break;
        case CometChatUIKitConstants.messages.MESSAGE_DELIVERED:
        case CometChatUIKitConstants.messages.MESSAGE_READ:
          this.messageReadAndDelivered(message);
          break;
        case CometChatUIKitConstants.messages.MESSAGE_DELETED:
        case CometChatUIKitConstants.messages.MESSAGE_EDITED: {
          this.messageEdited(message);
          break;
        }
        case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
        case CometChatUIKitConstants.groupMemberAction.JOINED:
        case CometChatUIKitConstants.groupMemberAction.LEFT:
        case CometChatUIKitConstants.groupMemberAction.ADDED:
        case CometChatUIKitConstants.groupMemberAction.KICKED:
        case CometChatUIKitConstants.groupMemberAction.BANNED:
        case CometChatUIKitConstants.groupMemberAction.UNBANNED: {
          this.addMessage(message)
          break;
        }
        case CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED:
            this.customMessageReceived(message);
          break;
        default:
          return;
      }
      this.ref.detectChanges()
    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
  }

  /**
 * translate message then call update message
 * @param  {CometChat.BaseMessage} message
 */
  // translateMessage(message: CometChat.BaseMessage) {
  // }
  /**
   * @param  {CometChat.BaseMessage} message
   */
  markMessageAsDelivered = (message: CometChat.BaseMessage) => {
    if (!this.disableReceipt &&  message?.getSender().getUid() !== this.loggedInUser?.getUid() && message.hasOwnProperty("deliveredAt") === false) {
      CometChat.markAsDelivered(message)
    }
  };
  /**
   * When Message is Received
   * @param message
   */
  /**
   * @param  {CometChat.BaseMessage} message
   */
  messageReceived(message: CometChat.BaseMessage) {
    this.markMessageAsDelivered(message)
    try {
      if (
        this.group &&
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
        message.getReceiverId() === this.group?.getGuid()
      ) {
        this.messageReceivedHandler(message, CometChatUIKitConstants.MessageReceiverType.group);
      } else if (
        this.user &&
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user &&
        message?.getSender().getUid() === this.user?.getUid()
      ) {
        if ((!message?.getReadAt() && !message?.getParentMessageId()  && this.isOnBottom) || (!message?.getReadAt() && message.getParentMessageId() && this.parentMessageId  && this.isOnBottom)) {
          if (!this.disableReceipt) {
            CometChat.markAsRead(message).then(() => {
                CometChatMessageEvents.ccMessageRead.next( message)
            });
          }
          else {
            this.UnreadCount = [];
            this.ref.detectChanges()
          }
          CometChatMessageEvents.ccMessageRead.next( message)
        }
        this.messageReceivedHandler(message, CometChatUIKitConstants.MessageReceiverType.user);
      }
    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
    this.ref.detectChanges();
  }
  /**
 * Updating the reply count of Thread Parent Message
 * @param  {CometChat.BaseMessage} messages
 */
  updateReplyCount(messages: CometChat.BaseMessage) {
    try {
      const receivedMessage = messages;
      let messageList: CometChat.BaseMessage[] = [...this.messagesList];
      let messageKey = messageList.findIndex(
        (m) => m.getId() === receivedMessage.getParentMessageId()
      );
      if (messageKey > -1) {
        const messageObj: CometChat.BaseMessage = messageList[messageKey];
        let replyCount = messageObj.getReplyCount() ? messageObj.getReplyCount() : 0;
        replyCount = replyCount + 1;
        messageObj.setReplyCount(replyCount);
        messageList.splice(messageKey, 1, messageObj);
        this.messagesList = [...messageList];
        this.ref.detectChanges();
      }
    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
  }
  /**
   * @param  {CometChat.BaseMessage} message
   * @param  {string} type
   */
  messageReceivedHandler = (message: CometChat.BaseMessage, type: string) => {
    ++this.messageCount;
    if (message.getParentMessageId()) {
      this.updateReplyCount(message);
      this.addMessage(message);
    } else {
      if (this.messageCount > this.thresholdValue) {
        this.keepRecentMessages = true
        this.reInitializeMessageBuilder();
      }
      this.addMessage(message);
      if (!this.isOnBottom) {
        if (this.scrollToBottomOnNewMessages) {
          setTimeout(() => {
            this.scrollToBottom()
          }, 100);
        }
        else {
          let countText = localize("NEW_MESSAGES")
          if (this.newMessageIndicatorText && this.newMessageIndicatorText != "") {
            countText = this.newMessageIndicatorText
          }
          else {
            countText = this.UnreadCount.length > 0 ?  localize("NEW_MESSAGES") :  localize("NEW_MESSAGE")
          }
          this.UnreadCount.push(message)
          this.newMessageCount = " ↓ " + this.UnreadCount.length + " " + countText;
          this.ref.detectChanges()
        }
      }
    }
    this.playAudio();
    //handling dom lag - increment count only for main message list
    if (message.hasOwnProperty("parentMessageId") === false && this.parentMessageId) {
      ++this.messageCount;
      this.ref.detectChanges()
    } else if (message.hasOwnProperty("parentMessageId") === true && this.parentMessageId) {
      if (message.getParentMessageId() === this.parentMessageId && this.isOnBottom) {
        if (!this.disableReceipt) {
          CometChat.markAsRead(message).then(() => {
              CometChatMessageEvents.ccMessageRead.next( message)
          });
        }
        else {
          this.UnreadCount = [];
          this.ref.detectChanges()
        }
        this.ref.detectChanges()
      }
    } else {
    }
  };
  playAudio() {
    if (!this.disableSoundForMessages) {
      if (this.customSoundForMessages) {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage, this.customSoundForMessages)
      }
      else {
        CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage)
      }
    }
  }
  reInitializeMessageList() {
    this.reinitialized = true
    this.msgListenerId = "message_"+ new Date().getTime();
    this.groupListenerId = "group_"+ new Date().getTime();
    this.callListenerId = "call_"+ new Date().getTime();
    this.addMessageEventListeners();
    if (this.messagesRequestBuilder) {
      if (this.keepRecentMessages) {
        this.messagesList.splice(1, this.messagesList.length - 30);
      }
      else {
        this.messagesList.splice(30);
      }
      this.requestBuilder = this.messagesRequestBuilder
    }
    else {
      if (this.keepRecentMessages) {
        this.messagesList.splice(1, this.messagesList.length - 30);
       this.scrollToBottom()
      }
      else {
        this.messagesList.splice(30);
      }
    }
    this.ref.detectChanges();
  }
  reInitializeMessageBuilder = () => {
    if (!this.parentMessageId) {
      this.messageCount = 0;
    }
    this.requestBuilder = null
    CometChat.removeMessageListener(this.msgListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
    CometChat.removeCallListener(this.callListenerId)
    this.reInitializeMessageList()
  };
  getMessageReceipt(message: CometChat.BaseMessage) {
    let receipt =   MessageReceiptUtils.getReceiptStatus(message)
    return receipt
  }
  messageReadAndDelivered(message: CometChat.MessageReceipt) {
    try {
      if (
        message.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user &&
        message?.getSender().getUid() == this.user?.getUid() &&
        message.getReceiver() == this.loggedInUser?.getUid()
      ) {
        if (message.getReceiptType() == CometChatUIKitConstants.messages.DELIVERY) {
          //search for message
          let messageKey = this.messagesList.findIndex(
            (m: CometChat.BaseMessage) => m.getId() == Number(message.getMessageId())
          );
          if (messageKey > -1) {
            this.messagesList[messageKey].setDeliveredAt(message.getDeliveredAt())
            this.ref.detectChanges();
          }
          // this.ref.detectChanges();
          this.markAllMessagAsDelivered( messageKey);
        } else if (message.getReceiptType() == CometChatUIKitConstants.messages.READ) {
          //search for message
          let messageKey = this.messagesList.findIndex(
            (m: CometChat.BaseMessage) => m.getId() == Number(message.getMessageId())
          );
          if (messageKey > -1) {
            this.messagesList[messageKey].setReadAt(message?.getReadAt());
            this.ref.detectChanges();
          }
          this.ref.detectChanges();
          this.markAllMessagAsRead( messageKey)
        }
      } else if (
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
        message.getReceiver() === this.group?.getGuid()
      ) {
        return
      }
    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
    this.ref.detectChanges()
  }
  /**
 * @param  {CometChat.BaseMessage} readMessage
 */
   markAllMessagAsRead( messageKey: number) {
    for(let i = messageKey; i >=0; i--){
      if (!this.messagesList[i].getReadAt()) {
    this.messagesList[i].setReadAt(CometChatUIKitUtility.getUnixTimestamp());
    this.ref.detectChanges();
  }
    }
    CometChatMessageEvents.ccMessageRead.next( this.messagesList[messageKey])
    }
  markAllMessagAsDelivered(messageKey: number) {
    for (let i = messageKey; i >= 0; i--) {
      if (!this.messagesList[i].getDeliveredAt()) {
        this.messagesList[i].setDeliveredAt(CometChatUIKitUtility.getUnixTimestamp());
        this.ref.detectChanges();
      }
    }
  }
  /**
   * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
   * @param {CometChat.BaseMessage} message
   */
  /**
   * Detects if the message that was edit is your current open conversation window
   * @param {CometChat.BaseMessage} message
   */
  messageEdited = (message: CometChat.BaseMessage) => {
    try {
      if (
        this.group &&
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
        message.getReceiverId() === this.group?.getGuid()
      ) {
        this.updateEditedMessage(message);
      } else if (
        this.user &&
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user &&
        this.loggedInUser?.getUid() === message.getReceiverId() &&
        message?.getSender().getUid() === this.user?.getUid()
      ) {
        this.updateEditedMessage(message);
      } else if (
        this.user &&
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user &&
        this.loggedInUser?.getUid() === message?.getSender().getUid() &&
        message.getReceiverId() === this.user?.getUid()
      ) {
        this.updateEditedMessage(message);
      }
    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
    this.ref.detectChanges()
  };
  /**
   * Emits an Action Indicating that a message was deleted by the user/person you are chatting with
   * @param {CometChat.BaseMessage} message
   */
  updateEditedMessage = (message: CometChat.BaseMessage) => {
    const messageList = this.messagesList;
    const messageKey = messageList.findIndex(m => m.getId() === message.getId());
    if (messageKey > -1) {
      this.messagesList = [
        ...messageList.slice(0, messageKey),
        message,
        ...messageList.slice(messageKey + 1)
      ];
    }
    this.ref.detectChanges();
  };
  /**
   * Emits an Action Indicating that Group Data has been updated
   * @param
   */
  /**
   * When custom messages are received eg. Poll, Stickers emits action to update message list
   * @param message
   */
  /**
   * @param  {CometChat.BaseMessage} message
   */
  customMessageReceived(message: CometChat.BaseMessage): any {
    try {
      this.markMessageAsDelivered(message);
      if (
        this.group &&
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
        message.getReceiverId() === this.group?.getGuid()
      ) {
        if ((!message?.getReadAt() && !message?.getParentMessageId()  && this.isOnBottom) || (!message?.getReadAt() && message.getParentMessageId() && this.parentMessageId && this.isOnBottom) ) {
          if (!this.disableReceipt) {
            CometChat.markAsRead(message).then(() => {
                CometChatMessageEvents.ccMessageRead.next( message)
            });
          }
          else {
            this.UnreadCount = [];
            this.ref.detectChanges()
          }
        }
        this.customMessageReceivedHandler(message, CometChatUIKitConstants.MessageReceiverType.group)
      }
      else if (
        this.user &&
        message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user &&
        ((message?.getSender().getUid() === this.user?.getUid() &&
          message.getReceiverId() === this.loggedInUser?.getUid())
          || (
            this.loggedInUser?.getUid() === message?.getSender().getUid() &&
            message.getReceiverId() === this.user?.getUid()
          ))
      ) {
        if ((!message?.getReadAt() && !message?.getParentMessageId() && this.isOnBottom) || (!message?.getReadAt() && message.getParentMessageId() && this.parentMessageId && this.isOnBottom)) {
          if (!this.disableReceipt) {
            CometChat.markAsRead(message).then(() => {
                CometChatMessageEvents.ccMessageRead.next( message)
            });
          }
          else {
            this.UnreadCount = [];
            this.ref.detectChanges()
          }
        }
        this.customMessageReceivedHandler(message, CometChatUIKitConstants.MessageReceiverType.user)
      }
    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
    this.ref.detectChanges();
    return true;
  }
  /**
   * @param  {CometChat.BaseMessage} message
   * @param  {string} type
   */
  customMessageReceivedHandler = (message: CometChat.BaseMessage, type: string) => {
    ++this.messageCount;
    // add received message to messages list
    if (message.getParentMessageId()) {
      this.updateReplyCount(message);
      this.addMessage(message);
    } else {
      if (this.messageCount > this.thresholdValue) {
        this.keepRecentMessages = true
        this.reInitializeMessageBuilder();
      }
      this.addMessage(message);
      if (!this.isOnBottom) {
        if (this.scrollToBottomOnNewMessages) {
          setTimeout(() => {
            this.scrollToBottom()
          }, 100);
        }
        else {
          let countText = localize("NEW_MESSAGES")
          if (this.newMessageIndicatorText && this.newMessageIndicatorText != "") {
            countText = this.newMessageIndicatorText
          }
          else {
            countText = this.UnreadCount.length > 0 ?  localize("NEW_MESSAGES") :  localize("NEW_MESSAGE")
          }
          this.UnreadCount.push(message)
          this.newMessageCount = " ↓ " + this.UnreadCount.length + " " + countText;
          this.ref.detectChanges()
        }
      }
    }
    this.playAudio();
    //handling dom lag - increment count only for main message list
    if (message.hasOwnProperty("parentMessageId") === false && !this.parentMessageId) {
      ++this.messageCount;
      //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
    } else if (message.hasOwnProperty("parentMessageId") === true && this.parentMessageId  && this.isOnBottom) {
      if (message.getParentMessageId() === this.parentMessageId ) {
        if (!this.disableReceipt ) {
          CometChat.markAsRead(message).then(() => {
              CometChatMessageEvents.ccMessageRead.next( message)
          });
        }
        else {
          this.UnreadCount = [];
          this.ref.detectChanges()
        }
      }
    } else {
    }
    this.ref.detectChanges();
  };
  /**
   * TrackBy method to update UI when a change is detected
   */
  /**
   * @param  {number} index
   * @param  {any} item
   */
  getMessageId(index: number, item: any) {
    return item.editedAt || item.readAt || item.deliveredAt || item.id;
  }
  /**
   * Compares two dates and sets Date on a a new day
   */
  /**
   * @param  {number} firstDate
   * @param  {number} secondDate
   */
   isDateDifferent(firstDate: number | undefined, secondDate: number | undefined) {
    let firstDateObj: Date, secondDateObj: Date;
    firstDateObj = new Date(firstDate! * 1000);
    secondDateObj = new Date(secondDate! * 1000);
    return firstDateObj.getDate() !== secondDateObj.getDate() ||
      firstDateObj.getMonth() !== secondDateObj.getMonth() ||
      firstDateObj.getFullYear() !== secondDateObj.getFullYear();
  }
  /**
   * prepend Fetched Messages
   * @param {CometChat.BaseMessage} messages
   */
   prependMessages(messages: CometChat.BaseMessage[]) {
     try {
       this.messagesList = [...messages, ...this.messagesList];
       this.messageCount = this.messagesList.length;
       if (this.messageCount > this.thresholdValue) {
         this.keepRecentMessages = false;
         this.reInitializeMessageBuilder();
       }
       this.ngZone.run(() => {
       if(this.state != States.loaded){
        this.state = States.loaded
       }
         this.ref.detach(); // Detach the change detector
       });
  if(this.chatChanged){

   CometChatUIEvents.ccActiveChatChanged.next({
      user:this.user,
      group:this.group,
      message: messages[messages?.length -1]
    })
    this.chatChanged = false
    this.scrollToBottom();
  }
     } catch (error: any) {
       this.state = States.error
       if (this.onError) {
         this.onError(error);
       }
     }
   }
  /**
   * listening to bottom scroll using intersection observer
   */
   ioBottom() {
    const options = {
      root: this.listScroll.nativeElement,
      rootMargin: '-100% 0px 100px 0px',
      threshold: 0,
    };
    const callback = (entries: any) => {
this.isOnBottom = false
      const lastMessage = this.UnreadCount[this.UnreadCount.length - 1];
      this.isOnBottom = entries[0].isIntersecting;
      if(this.isOnBottom){
        this.fetchNextMessage()
        if (!this.disableReceipt && this.UnreadCount?.length > 0) {
          CometChat.markAsRead(lastMessage).then((res: CometChat.MessageReceipt) => {
            this.UnreadCount = [];
            let messageKey = this.messagesList.findIndex((m: CometChat.BaseMessage) => m.getId() === Number(res?.getMessageId()));
            if (messageKey > -1) {
                this.markAllMessagAsRead(messageKey)
            }
             this.ref.detectChanges()
            CometChatMessageEvents.ccMessageRead.next( lastMessage);
          });
        } else {
          this.UnreadCount = [];
           this.ref.detectChanges()
        }
      }
    };
    var observer:IntersectionObserver =   new IntersectionObserver(callback, options);
    observer.observe(this.bottom.nativeElement)
  };
  /**
 * listening to top scroll using intersection observer
 */
  ioTop(){
    const options = {
      root: this.listScroll.nativeElement,
      rootMargin: '200px 0px 0px 0px',
      threshold: 1.0
    }
    const callback = (entries: any) => {
      this.isOnBottom = false
      if (entries[0].isIntersecting) {
        this.numberOfTopScroll++;
        if (this.numberOfTopScroll > 1) {
          this.fetchPreviousMessages()
        }
      }
    }
   var observer:IntersectionObserver =   new IntersectionObserver(callback, options);
    observer.observe(this.top.nativeElement);
  }
  // public methods
  addMessage = (message: CometChat.BaseMessage) => {
    if(!message?.getParentMessageId() || this.parentMessageId){
      this.messagesList.push(message)
      if(!message?.getSender() ||  this.loggedInUser?.getUid() == message?.getSender()?.getUid() || this.isOnBottom){
        this.scrollToBottom()
        this.ref.detectChanges()
      }
     }

    if(this.state != States.loaded){
       this.state = States.loaded
       this.ref.detectChanges()
    }
    this.ref.detectChanges()
  }
    /**
   * callback for copy message
   * @param  {CometChat.TextMessage} object
   */
     onCopyMessage = (object: CometChat.TextMessage) => {
      navigator.clipboard.writeText(object.getText())
    }
      /**
   * callback for deleteMessage
   * @param  {CometChat.BaseMessage} object
   */
    /**
   * @param  {CometChat.BaseMessage} messages
   */
     messageSent(messages: CometChat.BaseMessage) {
      const message: CometChat.BaseMessage = messages;
      const messageList: CometChat.BaseMessage[] = [...this.messagesList];
      let messageKey = messageList.findIndex((m: CometChat.BaseMessage) => m.getMuid() === message.getMuid());
      if (messageKey > -1) {
        messageList.splice(messageKey, 1, message);
      }
      this.messagesList = messageList;
      this.ref.detectChanges()
      this.scrollToBottom();
    }
      /**
   * callback for editMessage option
   * @param  {CometChat.BaseMessage} object
   */
  onEditMessage = (object: CometChat.BaseMessage) => {
    CometChatMessageEvents.ccMessageEdited.next({message:object,status:MessageStatus.inprogress});
  }
  updateMessage(message: CometChat.BaseMessage, muid: boolean = false) {
    if (muid) {
      this.messageSent(message)
    }
    else {
      this.updateEditedMessage(message)
    }
  }
  removeMessage = (message: CometChat.BaseMessage) => {
    try {
      const messageKey = this.messagesList.findIndex(msg => msg?.getId() === message.getId());
      if (messageKey > -1) {
        this.messagesList.splice(messageKey, 1, message);
        this.messagesList = [...this.messagesList];
        this.ref.detectChanges();
      }
    } catch (error) {
      if(this.onError){
this.onError(error);
}
    }
  };
  deleteMessage = (message: CometChat.BaseMessage) => {
    try {
      const messageId: any = message.getId();
      CometChat.deleteMessage(messageId)
        .then((deletedMessage) => {
            CometChatMessageEvents.ccMessageDeleted.next(deletedMessage)
          // this.ref.detectChanges()
        })
        .catch((error:any) => {
          if(this.onError){
this.onError(error);
}
        });
    } catch (error:any) {
       if(this.onError){
this.onError(error);
}
    }
  }
  scrollToBottom = () => {
    try {
      setTimeout(() => {
        this.listScroll.nativeElement.scroll({
          top: this.listScroll.nativeElement.scrollHeight,
          left: 0,
        });
        this.isOnBottom = true;
        this.ref.detectChanges();
      }, 10);
    } catch (error: any) {
      if(this.onError){
this.onError(error);
}
    }
  }
  showHeaderTitle(message:CometChat.BaseMessage){
    if(this.alignment == MessageListAlignment.left){
      return true
    }
  else{
     if(this.group &&  message?.getCategory() != CometChatUIKitConstants.MessageCategory.action && !message?.getDeletedAt() && message?.getSender() && message?.getSender().getUid() != this.loggedInUser?.getUid() && this.alignment == MessageListAlignment.standard){
      return true
    }
    else{
      return false
    }
  }
  }
   subscribeToEvents() {
    this.ccShowPanel = CometChatUIEvents.ccShowPanel.subscribe((data:IPanel)=>{
      this.smartReplyConfig = data.configuration!
      this.smartReplyMessage = data.message!
      this.enableSmartReply = true
      this.showSmartReply = true
      this.ref.detectChanges()

          })
          this.ccHidePanel = CometChatUIEvents.ccHidePanel.subscribe(()=>{

            this.smartReplyMessage = null
            this.enableSmartReply = false
            this.showSmartReply = false

          })
   this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
     item
   this.appendMessages(item.messages!)
   })
   this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => {
    this.addMessage(item.message!)
   })
   this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => {
     this.addMessage(item.message!)
   })
   this.ccGroupMemberScopeChanged = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe((item: IGroupMemberScopeChanged) => {
    this.addMessage(item.message!)
  })
   this.ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe((item: IGroupLeft) => {
    this.addMessage(item.message!)
   })
    this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object: IMessages) => {
       if(object?.status == MessageStatus.success){
        this.updateMessage(object.message!)
      }
    })
    this.ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe((obj: IMessages) => {
      let message: CometChat.BaseMessage = obj.message!
      switch (obj.status) {
        case MessageStatus.inprogress: {
          this.addMessage(message);
          this.playAudio();
          break;
        }
        case MessageStatus.success: {
         if(message.getParentMessageId() || this.parentMessageId){
         this.updateReplyCount(message)
         }
          this.updateMessage(message, true);
          break;
        }
        case MessageStatus.success: {
          this.updateMessage(message)
         }
      }
    })
    this.ccMessageDelete = CometChatMessageEvents.ccMessageDeleted.subscribe((messageObject: CometChat.BaseMessage) => {
     this.removeMessage(messageObject)
      this.ref.detectChanges();
    })
    this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call:CometChat.Call)=>{
      this.showOngoingCall = false
      this.sessionId = ""
      if(call){
        this.addMessage(call)
      }
      this.ref.detectChanges()
    })
    this.ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe((call: CometChat.Call) => {
     this.addMessage(call)
    })
    this.ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe((call: CometChat.Call) => {

      this.addMessage(call)
    })
    this.ccCallAccepted = CometChatCallEvents.ccCallAccepted.subscribe((call: CometChat.Call) => {
      this.addMessage(call)
    })
  }
  closeSmartReply =()=>{
    this.showSmartReply = false
    this.smartReplyMessage = null
    this.ref.detectChanges()
   }
  sendReply =(event:any)=>{
    let reply:string = event?.detail?.reply
if(this.smartReplyConfig.ccSmartRepliesClicked){
this.smartReplyConfig.ccSmartRepliesClicked(reply,this.smartReplyMessage!,this.onError,this.customSoundForMessages,this.disableSoundForMessages)
this.closeSmartReply()
}
  }
  getReplies(): string[] | null {
    let smartReply:any = this.smartReplyMessage
    const smartReplyObject = smartReply?.metadata?.[SmartRepliesConstants.injected]?.extensions?.[SmartRepliesConstants.smart_reply];
    if (smartReplyObject?.reply_positive && smartReplyObject?.reply_neutral && smartReplyObject?.reply_negative) {

      const { reply_positive, reply_neutral, reply_negative } = smartReplyObject;
      return [reply_positive, reply_neutral, reply_negative];
    }
    return null;
  }
  unsubscribeToEvents() {
    this.ccGroupMemberAdded?.unsubscribe();
    this.ccGroupMemberBanned?.unsubscribe();
    this.ccGroupMemberJoined?.unsubscribe();
    this.ccGroupMemberKicked?.unsubscribe();
    this.ccOwnershipChanged?.unsubscribe();
    this.ccGroupLeft?.unsubscribe();
    this.ccMessageEdit?.unsubscribe();
    this.ccMessageSent?.unsubscribe();
    this.ccLiveReaction?.unsubscribe();
    this.ccMessageDelete?.unsubscribe();
    this.ccGroupMemberScopeChanged?.unsubscribe()
  }
  /**
* styling part
*/
  chatsListStyle = () => {
    return {
      height: this.messageListStyle.height,
      background: this.messageListStyle.background,
    };
  }
  messageContainerStyle = () => {
    return {
      width: this.messageListStyle.width,
    };
  }
  errorStyle = () => {
    return {
      textFont: this.messageListStyle.errorStateTextFont,
      textColor: this.messageListStyle.errorStateTextColor,
    }
  }
  emptyStyle = () => {
    return {
      textFont: this.messageListStyle.emptyStateTextFont,
      textColor: this.messageListStyle.emptyStateTextColor,
    }
  }
  loadingStyle = () => {
    return {
      iconTint: this.messageListStyle.loadingIconTint,
    }
  }
  wrapperStyle = () => {
    return {
      height: this.messageListStyle.height,
      width: this.messageListStyle.width,
      background: this.messageListStyle.background,
      border: this.messageListStyle.border,
      borderRadius: this.messageListStyle.borderRadius
    }
  }
}
