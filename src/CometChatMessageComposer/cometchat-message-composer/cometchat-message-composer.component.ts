import { Component, OnInit, Input, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { EmojiKeyboardStyle ,PopoverStyle,ActionSheetStyle,PreviewStyle} from 'my-cstom-package-lit'
import {  Subscription } from 'rxjs';
import { localize, CometChatMessageComposerAction, AuxiliaryButtonAlignment, Placement, CometChatMessageEvents, CometChatUIKitConstants, IMessages, MessageStatus, fontHelper } from 'uikit-resources-lerna';
import { MessageComposerStyle, CometChatSoundManager, StickersConstants,StickersConfiguration ,StickersStyle, CreatePollStyle, BaseStyle,CometChatUIKitUtility} from 'uikit-utils-lerna';
import { CometChatThemeService } from '../../CometChatTheme.service';
import { ChatConfigurator } from '../../Shared/Framework/ChatConfigurator';
import 'uikit-utils-lerna'
import 'my-cstom-package-lit'


/**
*
* CometChatMessageComposer is used to send message to user or group.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-message-composer',
  templateUrl: './cometchat-message-composer.component.html',
  styleUrls: ['./cometchat-message-composer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatMessageComposerComponent implements OnInit, OnChanges {
  @ViewChild("inputElement", { static: false }) inputElementRef!: ElementRef;
  @ViewChild("inputRef", { static: false }) inputRef!: ElementRef;
  @ViewChild("emojiButtonRef", { static: false }) emojiButtonRef!: ElementRef;
  @ViewChild("actionSheetRef", { static: false }) actionSheetRef!: ElementRef;
  @ViewChild("stickerButtonRef", { static: false }) stickerButtonRef!: ElementRef;
  @Input() user!: CometChat.User;
  @Input() group!: CometChat.Group;
  @Input() disableSoundForMessages: boolean = false;
  @Input() customSoundForMessage: string = "";
  @Input() disableTypingEvents: boolean = false;
  @Input() text: string = "";
  @Input() placeholderText: string = localize("SEND_MESSAGE");
  @Input() headerView!: TemplateRef<any>;
  @Input() onTextChange!: (text:string)=> void;
  @Input() attachmentIconURL: string = "assets/Plus.svg";
  @Input() attachmentOptions:((item:CometChat.User | CometChat.Group,composerId:ComposerId )=>CometChatMessageComposerAction[]) | undefined;
  @Input() secondaryButtonView!: TemplateRef<any>;
  @Input() auxilaryButtonView!: TemplateRef<any>;
  @Input() auxiliaryButtonsAlignment: AuxiliaryButtonAlignment = AuxiliaryButtonAlignment.right;
  @Input() sendButtonView!: TemplateRef<any>;
  @Input() parentMessageId: number = 0;
  @Input() hideLiveReaction: boolean = false;
  @Input() LiveReactionIconURL: string = "assets/heart-reaction.png";
  @Input() messageComposerStyle: MessageComposerStyle = {
    height: "100%",
    width: "100%",
    borderRadius: "12px",
    maxInputHeight:"100px"
  };
  @Input() onSendButtonClick: ((message:CometChat.BaseMessage)=> void) | undefined;
  @Input() onError:(error:any)=> void = (error:any)=>{
    console.log(error)
  };
  @Input() backdropStyle :BaseStyle = {
    height:"100%",
    width:"100%",
    background:"rgba(0, 0, 0, 0.5)"
  }
  public composerId!:ComposerId;
  public composerActions:CometChatMessageComposerAction[] = [];
  showCreatePolls:boolean = false;
  showStickerKeyboard:boolean = false;
  showActionSheetItem: boolean = false;
  showPreview: boolean = false;
  editPreviewObject!: CometChat.TextMessage;
  ccMessageEdit!: Subscription;
  public acceptHandlers:any = {
    "image/*": this.onImageChange.bind(this),
    "video/*": this.onVideoChange.bind(this),
    "audio/*": this.onAudioChange.bind(this),
    "file/*": this.onFileChange.bind(this),
  };
  public enableStickerKeyboard:boolean = false;
  public stickerConfiguration:{
    id?:string,
    configuration?:StickersConfiguration
  } = {}
  closeIconURL: string = "assets/plus-rotated.svg";
  sendButtonStyle: any = {
    height: "24px",
    width: "24px",
    border: "none",
    borderRadius: "0",
    buttonIconTint: "rgba(20, 20, 20, 0.58)",
    background: "transparent"
  }
  liveReactionStyle:any = {
    height: "24px",
    width: "24px",
    border: "none",
    borderRadius: "0",
    buttonIconTint: "red",
    background: "transparent",
    display:"flex",
    justifyContent:"center",
    alignItems:"center"
  }
  localize:typeof localize=localize
  emojiButtonStyle: any = {
    height: "24px",
    width: "24px",
    border: "none",
    borderRadius: "0",
    buttonIconTint: "grey",
    background: "transparent"
  }

  emojiKeyboardStyle: EmojiKeyboardStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    textFont: "500 12px Inter, sans-serif",
    textColor: "",
    background: "",
    borderRadius: "12px",
  }


  stickerKeyboardStyle: StickersStyle = {}
  messageInputStyle: any = {
  }
  previewStyle: PreviewStyle = {
    height: "100%",
    width: "100%",
  }
  createPollStyle:CreatePollStyle = {}
  storeTypingInterval: any;
  emojiPopover: PopoverStyle = {
    width: "315px",
    height: "320px",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
  }
  stickerPopover: PopoverStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
  }
  popoverStyle: PopoverStyle = {
    width: "275px",
    height: "280px",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
  }
  sendButtonIconURL: string = "assets/Send.svg"
  emojiButtonIconURL: string = "assets/Stipop.svg"
  stickerButtonIconURL: string = "assets/Stickers.svg"
  actionsheetStyle: ActionSheetStyle = {
    layoutModeIconTint: "rgba(20, 20, 20, 0.04)",
    borderRadius: "inherit",
    background: "rgb(255,255,255)",
    border: "none",
    width: "100%",
    height: "100%",
    titleFont: "500 15px Inter, sans-serif",
    titleColor: "#141414",
    listItemBackground: "",
    ActionSheetSeparatorTint: "1px solid RGBA(20, 20, 20, 0.08)"
  }
  actions!: CometChatMessageComposerAction[];
  messageText: string = "";
  attachmentButtonStyle: any = {
    height: "24px",
    width: "24px",
    border: "none",
    borderRadius: "0",
    buttonIconTint: "grey",
    background: "transparent"
  }
  auxilaryPlacement: Placement = Placement.top
  messageSending: boolean = false;
  messageToBeEdited!: CometChat.TextMessage;
  showSendButton: boolean = false;
  showEmojiKeyboard: boolean = false;
  loggedInUser!:CometChat.User | null;
  sendMessageOnEnter = (event: any) => {
    this.showSendButton = false;
    this.sendTextMessage(event.detail.value);
    this.inputRef?.nativeElement?.emptyInputField()
  }
  messageInputChanged = (event: any) => {
    const text = event?.detail?.value?.trim();
    this.sendButtonStyle = {
      height: "24px",
      width: "24px",
      border: "none",
      borderRadius: "0",
      buttonIconTint: text ? this.messageComposerStyle.sendIconTint : this.themeService.theme.palette.getAccent600(),
      background: "transparent"
    };
    this.showSendButton = true;
    if (this.onTextChange) {
      this.onTextChange(text)
    }
    this.messageText = text;
    if (text) {
      this.startTyping()
    } else {
      this.endTyping()
    }
  }
  appendEmoji = (event: any) => {
    if (this.text === event?.detail.id) {
      this.text = "" + "";
      this.ref.detectChanges()
    }
    this.text = event?.detail.id;
    this.ref.detectChanges()
  }
  sendReaction(){
    let receiverId: string = this.user ? this.user?.getUid()! : this.group?.getGuid()!;
    let receiverType = this.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
    let data = { "LIVE_REACTION": this.LiveReactionIconURL };
    let transientMessage = new CometChat.TransientMessage(receiverId, receiverType, data);
    CometChat.sendTransientMessage(transientMessage);
    CometChatMessageEvents.ccLiveReaction.next(this.LiveReactionIconURL)
    return;
  }
  openCreatePolls = ()=>{
this.showCreatePolls = true;
if (this.showActionSheetItem) {
  this.actionSheetRef.nativeElement.click();
  this.showActionSheetItem = !this.showActionSheetItem;
}
this.ref.detectChanges()
  }
  closeCreatePolls = ()=>{
    this.showCreatePolls = false;

    this.ref.detectChanges()
  }
  addAttachmentCallback(): void {
    this.composerActions?.forEach((element: CometChatMessageComposerAction) => {
      switch (element.id) {
        case CometChatUIKitConstants.MessageTypes.audio:
          element.onClick = this.openAudioPicker;
          break;
        case CometChatUIKitConstants.MessageTypes.video:
          element.onClick = this.openvideoPicker;
          break;
        case CometChatUIKitConstants.MessageTypes.file:
          element.onClick = this.openFilePicker;
          break;
        case CometChatUIKitConstants.MessageTypes.image:
          element.onClick = this.openImagePicker;
          break;
          case "extension_poll":
            element.onClick = this.openCreatePolls;
            break;
      }
    });
  }


  subscribeToEvents() {
    this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object: IMessages) => {
       if(object?.status == MessageStatus.inprogress){
        this.messageToBeEdited = object.message as CometChat.TextMessage
        this.openEditPreview();
      }
    })
  }
  openEditPreview(){
    this.showPreview = true;
    this.text = this.messageToBeEdited.getText()
    this.ref.detectChanges()
  }
  unsubscribeToEvents() {
    this.ccMessageEdit?.unsubscribe();
  }
  constructor( private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["user"] || changes["group"]){
      this.composerId = this.getComposerId()
      if (this.attachmentOptions) {
       this.composerActions = this.attachmentOptions(this.user || this.group, this.composerId)
      }
      else {
        this.composerActions = ChatConfigurator.getDataSource()?.getAttachmentOptions(this.themeService.theme,this.user,this.group,this.composerId);
        this.addAttachmentCallback();
      }
    }
  }
  customSendMethod(message: String) {
    this.showSendButton = false;
    this.sendTextMessage(message);
    this.showSendButton = false
    this.ref.detectChanges()
  }
  /**
     * @param  {String=""} textMsg
     */
  sendTextMessage(textMsg: String = ""): boolean {
    this.endTyping()
    try {
      // Dont Send Blank text messages -- i.e --- messages that only contain spaces
      if (this.messageText?.trim()?.length == 0 && textMsg?.trim()?.length == 0) {
        return false;
      }
      // wait for the previous message to be sent before sending the current message
      if (this.messageSending) {
        return false;
      }
      this.messageSending = true;
      // If its an Edit and Send Message Operation , use Edit Message Function
      if (this.messageToBeEdited) {
        this.editMessage();
        this.ref.detectChanges()
        return false;
      }
      let { receiverId, receiverType } = this.getReceiverDetails();
      let messageInput;
      if (textMsg !== null) {
        messageInput = textMsg.trim();
      } else {
        messageInput = this.messageText.trim();
      }
      let textMessage: CometChat.TextMessage = new CometChat.TextMessage(
        receiverId,
        messageInput,
        receiverType,
      );
      if (this.parentMessageId) {
        textMessage.setParentMessageId(this.parentMessageId);
      }
      textMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
      textMessage.setMuid(CometChatUIKitUtility.ID());

      // play audio after action generation
      if (!this.disableSoundForMessages) {
        this.playAudio();
      }
      //clearing Message Input Box
      this.messageText = "";
      this.inputRef?.nativeElement?.emptyInputField()
      this.text = ""
      this.messageSending = false;
      // End Typing Indicator Function
      this.closePopovers();
if(!this.onSendButtonClick){
  CometChatMessageEvents.ccMessageSent.next({
    message:textMessage,
    status: MessageStatus.inprogress,
  });
  CometChat.sendMessage(textMessage)
    .then((message: CometChat.TextMessage | CometChat.BaseMessage) => {
      let messageObject: CometChat.BaseMessage = message;
      CometChatMessageEvents.ccMessageSent.next( {
        message: messageObject,
        status: MessageStatus.success,
      });
      // Change the send button to reaction button
      setTimeout(() => {
        this.showSendButton = false;
        this.ref.detectChanges()
      }, 500);
    })
    .catch((error: any) => {
      textMessage.setMetadata({
        error:true
      })
      CometChatMessageEvents.ccMessageSent.next({
           message: textMessage,
        status: MessageStatus.error,
      });
    });
}
  else{
    this.onSendButtonClick(textMessage)
  }
    } catch (error: any) {
      this.onError(error);
    }
    return true;
  }
  editMessage() {
    try {
      const messageToBeEdited: any = this.messageToBeEdited;
      let { receiverId, receiverType } = this.getReceiverDetails();
      let messageText = this.messageText.trim();
      let textMessage: CometChat.TextMessage = new CometChat.TextMessage(
        receiverId,
        messageText,
        receiverType
      );
      textMessage.setId(messageToBeEdited.id);
      this.closePreview();
      this.endTyping();
      this.inputRef?.nativeElement?.emptyInputField()
      CometChat.editMessage(textMessage)
        .then((message) => {
          this.messageSending = false;
          CometChatMessageEvents.ccMessageEdited.next( {
            message: message,
            status: MessageStatus.success
          })
        })
        .catch((error) => {
          this.messageSending = false;
 if(this.onError){
   this.onError(error)
 }
        });
    } catch (error) {
        this.onError(error);
    }
  }
  getReceiverDetails() {
    let receiverId!: string;
    let receiverType!: string;
    if (this.user && this.user.getUid()) {
      receiverId = this.user.getUid();
      receiverType = CometChatUIKitConstants.MessageReceiverType.user;
    } else if (this.group && this.group.getGuid()) {
      receiverId = this.group.getGuid();
      receiverType = CometChatUIKitConstants.MessageReceiverType.group;
    }
    return { receiverId: receiverId, receiverType: receiverType };
  }
  playAudio() {
    if (this.customSoundForMessage) {
      CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage, this.customSoundForMessage)
    }
    else {
      CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage)
    }
  }
  /**
     * @param  {} timer=null
     * @param  {string=""} metadata
     */
  startTyping(timer = null, metadata: string = ""): void {
    if (!this.disableTypingEvents) {
      try {
        let typingInterval = timer || 5000;
        let { receiverId, receiverType } = this.getReceiverDetails();
        let typingMetadata = metadata || undefined;
        let typingNotification = new CometChat.TypingIndicator(
          receiverId,
          receiverType,
          typingMetadata
        );
        CometChat.startTyping(typingNotification);
        this.storeTypingInterval = setTimeout(() => {
          this.endTyping();
        }, typingInterval);
      } catch (error: any) {
        this.onError(error);
      }
    }
  }
  handleActions = (event:any)=>{
    let action:CometChatMessageComposerAction = event?.detail?.action;
    if(action.onClick){
      action.onClick()
    }
  }
  endTyping(metadata = null) {
    if (!this.disableTypingEvents) {
      try {
        let { receiverId, receiverType } = this.getReceiverDetails();
        let typingMetadata = metadata || undefined;
        let typingNotification = new CometChat.TypingIndicator(
          receiverId,
          receiverType,
          typingMetadata
        );
        CometChat.endTyping(typingNotification);
        clearTimeout(this.storeTypingInterval);
        this.storeTypingInterval = null;
      } catch (error: any) {
        this.onError(error);
      }
    }
  }
  /**
   * @param  {File | CometChat.MediaMessage} messageInput
   * @param  {string} messageType
   */
  sendMediaMessage(messageInput: File, messageType: string): boolean {
    try {
      if (this.messageSending) {
        return false;
      }
      this.messageSending = true;
      const { receiverId, receiverType } = this.getReceiverDetails();
      let mediaMessage: CometChat.MediaMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );
      if (this.parentMessageId) {
        mediaMessage.setParentMessageId(this.parentMessageId);
      }
      mediaMessage.setType(messageType);
      mediaMessage.setMetadata({
        ["file"]: messageInput,
      });
      mediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
      mediaMessage.setMuid(CometChatUIKitUtility.ID());

      if (!this.disableSoundForMessages) {
        this.playAudio();
      }
      this.messageSending = false;
      this.closePopovers()
     if(!this.onSendButtonClick){
      CometChatMessageEvents.ccMessageSent.next( {
        message: mediaMessage,
        status: MessageStatus.inprogress
      });
      CometChat.sendMessage(mediaMessage)
        .then((response: CometChat.BaseMessage) => {
          this.messageSending = false;
          response.setMuid(mediaMessage.getMuid())
          CometChatMessageEvents.ccMessageSent.next( {
            message: response,
            status: MessageStatus.success
          });
        })
        .catch((error) => {
          mediaMessage.setMetadata({
            error:true
          })
          CometChatMessageEvents.ccMessageSent.next( {
            message: mediaMessage,
            status:MessageStatus.error
          })
          this.messageSending = false;
        });
     }
     else{
      this.onSendButtonClick(mediaMessage)
     }
    } catch (error) {
      this.onError(error);
    }
    return true;
  }
  inputChangeHandler = (event: any): void => {
    const handler = this.acceptHandlers[this.inputElementRef.nativeElement.accept] || this.onFileChange.bind(this);
    handler(event);
  }
  sendSticker = (event:any)=>{
    let sticker = event?.detail?.stickerURL
    let stickerName:string = event?.detail?.stickerName
    if(this.stickerConfiguration?.configuration?.ccStickerClicked){
      this.stickerConfiguration?.configuration?.ccStickerClicked({
        name:stickerName,
        url:sticker
      },this.loggedInUser!,this.user,this.group,this.parentMessageId,this.onError,this.customSoundForMessage,this.disableSoundForMessages)
    }
  }
  /**
  * @param  {any} event
  */
  onVideoChange(event: any): boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener("load", () => {
        const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
        this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.VIDEO);
      }, false);
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error: any) {
      this.onError(error);
    }
    return true;
  }
  /**
   * @param  {any} event
   */
  onAudioChange(event: any): boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        "load",
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.AUDIO);
        },
        false
      );
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error: any) {
      this.onError(error);
    }
    return true;
  }
  /**
     * @param  {any} event
     */
  onImageChange(event: any): boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        "load",
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.IMAGE);
        },
        false
      );
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error) {
      this.onError(error);
    }
    return true;
  }
  /**
   * @param  {any} event
   */
  onFileChange(event: any): boolean {
    try {
      if (!event.target.files["0"]) {
        return false;
      }
      const uploadedFile = event.target.files["0"];
      var reader: any = new FileReader();
      reader.addEventListener(
        "load",
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.FILE);
        },
        false
      );
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error: any) {
      this.onError(error);
    }
    return true;
  }
  openImagePicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "image/*"
    this.inputElementRef.nativeElement.click();
    this.closePopovers()
  }
  openFilePicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "file/*"
    this.inputElementRef.nativeElement.click();
    this.closePopovers()
  }
  openvideoPicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "video/*"
    this.inputElementRef.nativeElement.click();
    this.closePopovers()
  }
  openAudioPicker = (): void => {
    this.inputElementRef.nativeElement.type = "file"
    this.inputElementRef.nativeElement.accept = "audio/*"
    this.inputElementRef.nativeElement.click();
    this.closePopovers()
  }
  openActionSheet = (event: any) => {
    this.showActionSheetItem = !this.showActionSheetItem;
    if (this.showEmojiKeyboard) {
      this.emojiButtonRef.nativeElement.click();
      this.showEmojiKeyboard = !this.showEmojiKeyboard;
    }
    if (this.showStickerKeyboard) {
      this.stickerButtonRef.nativeElement.click();
      this.showStickerKeyboard = !this.showStickerKeyboard;
      this.ref.detectChanges()
    }
    else {
      return
    }
  }
  openEmojiKeyboard = (event: any) => {
    this.showEmojiKeyboard = !this.showEmojiKeyboard;
    if (this.showActionSheetItem) {
      this.actionSheetRef.nativeElement.click();
      this.showActionSheetItem = !this.showActionSheetItem;
    }
    if (this.showStickerKeyboard) {
      this.stickerButtonRef.nativeElement.click();
      this.showStickerKeyboard = !this.showStickerKeyboard;
      this.ref.detectChanges()
    }
    else {
      return
    }
  }
  openStickerKeyboard = (event: any) => {
if(this.enableStickerKeyboard){
  this.showStickerKeyboard = !this.showStickerKeyboard;
  this.ref.detectChanges()
  this.ref.detectChanges()
  if (this.showActionSheetItem) {
    this.actionSheetRef.nativeElement.click();
    this.showActionSheetItem = !this.showActionSheetItem;
  }
  if (this.showEmojiKeyboard) {
    this.emojiButtonRef.nativeElement.click();
    this.showEmojiKeyboard = !this.showEmojiKeyboard;
  }
  else {
    return
  }
}
  }
  closePopovers() {
    if (this.showEmojiKeyboard) {
      this.emojiButtonRef.nativeElement.click();
      this.showEmojiKeyboard = !this.showEmojiKeyboard;
    }
    if (this.showActionSheetItem) {
      this.actionSheetRef.nativeElement.click();
      this.showActionSheetItem = !this.showActionSheetItem;
    }
  }
  getComposerId() : ComposerId {
    const user = this.user;
    if (user !== undefined) {
        return {user: user?.getUid(), group: null, parentMessageId:this.parentMessageId};
    }
    const group = this.group;
    if (group !== undefined) {
        return {user: null, group: group?.getGuid(), parentMessageId:this.parentMessageId};
    }
    return {user: null, group: null, parentMessageId:this.parentMessageId};
}
  ngOnInit(): void {

    CometChat.getLoggedinUser().then((user:CometChat.User | null)=>{
      this.loggedInUser = user
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })

    this.setTheme();
    this.subscribeToEvents();

    this.enableStickerKeyboard = true
    this.stickerConfiguration = ChatConfigurator.getDataSource()?.getAuxiliaryOptions(this.composerId,this.user,this.group);
    if(this.stickerConfiguration?.id == StickersConstants.sticker){
      this.enableStickerKeyboard = true
    }
    else{
      this.enableStickerKeyboard = false
    }
  }
  setTheme(){
    this.setComposerStyle();
    this.actionsheetStyle = {
      layoutModeIconTint: this.messageComposerStyle.ActionSheetLayoutModeIconTint || this.themeService.theme.palette.getAccent(),
      borderRadius: "inherit",
      background: this.themeService.theme.palette.getBackground(),
      border: "none",
      width: "100%",
      height: "100%",
      titleFont: this.messageComposerStyle.ActionSheetTitleFont || fontHelper(this.themeService.theme.typography.title2),
      titleColor: this.messageComposerStyle.ActionSheetTitleColor || this.themeService.theme.palette.getAccent(),
      ActionSheetSeparatorTint: this.messageComposerStyle.ActionSheetSeparatorTint || `1px solid ${this.themeService.theme.palette.getAccent400()}`
    }
    this.messageInputStyle = {
      height: "100%",
      width: "100%",
      maxHeight: this.messageComposerStyle.maxInputHeight || "100px",
      border: this.messageComposerStyle.border,
      borderRadius: "",
      background: this.messageComposerStyle.background ,
      textFont: this.messageComposerStyle.textFont  ,
      textColor: this.messageComposerStyle.textColor ,
      dividerColor: this.messageComposerStyle.dividerTint ,
      inputBorder: this.messageComposerStyle.inputBorder ,
      inputBorderRadius: "0",
      inputBackground: this.messageComposerStyle.inputBackground
    }
    this.sendButtonStyle = {
      height: "24px",
      width: "24px",
      border: "none",
      borderRadius: "0",
      buttonIconTint:  this.themeService.theme.palette.getAccent200(),
      background: "transparent"
    }
    this.previewStyle = {
      height:"100%",
      width:"100%",
      border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
      background: this.themeService.theme.palette.getBackground(),
      previewTitleFont: this.messageComposerStyle.previewTitleFont || fontHelper(this.themeService.theme.typography.subtitle1),
      previewTitleColor: this.messageComposerStyle.previewTitleColor ||  this.themeService.theme.palette.getAccent400(),
      previewSubtitleColor: this.messageComposerStyle.previewSubtitleColor || this.themeService.theme.palette.getAccent400(),
      previewSubtitleFont: this.messageComposerStyle.previewSubtitleFont  || fontHelper(this.themeService.theme.typography.subtitle2),
      closeButtonIconTint: this.messageComposerStyle.closePreviewTint || this.themeService.theme.palette.getAccent600(),
    }
    this.emojiButtonStyle = {
      height: "24px",
      width: "24px",
      border: "none",
      borderRadius: "0",
      buttonIconTint: this.messageComposerStyle.emojiIconTint || this.themeService.theme.palette.getAccent600(),
      background: "transparent"
    }
    this.emojiKeyboardStyle = {
      width: "100%",
      height: "100%",
      border: "none",
      textFont: this.messageComposerStyle.emojiKeyboardTextFont,
      textColor: this.messageComposerStyle.emojiKeyboardTextColor,
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "12px",
    }

    this.stickerKeyboardStyle = {
      width: "100%",
      height: "100%",
      border: "none",
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "12px",
    }
    this.attachmentButtonStyle = {
      height: "24px",
      width: "24px",
      border: "none",
      borderRadius: "0",
      buttonIconTint: this.messageComposerStyle.attachIcontint || this.themeService.theme.palette.getAccent600(),
      background: "transparent"
    }
    this.createPollStyle = {
      placeholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      placeholderTextColor: this.themeService.theme.palette.getAccent600(),
      deleteIconTint: this.themeService.theme.palette.getAccent600(),
      titleFont: fontHelper(this.themeService.theme.typography.title1),
      titleColor: this.themeService.theme.palette.getAccent(),
      closeIconTint: this.themeService.theme.palette.getPrimary(),
      questionInputBackground: this.themeService.theme.palette.getAccent100(),
      optionInputBackground: this.themeService.theme.palette.getAccent100(),
      answerHelpTextFont: fontHelper(this.themeService.theme.typography.caption1),
      answerHelpTextColor: this.themeService.theme.palette.getAccent400(),
      addAnswerIconTint: this.themeService.theme.palette.getPrimary(),
      createPollButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
      createPollButtonTextColor: this.themeService.theme.palette.getAccent("dark"),
      createPollButtonBackground: this.themeService.theme.palette.getPrimary(),
      addAnswerTextFont: fontHelper(this.themeService.theme.typography.text2),
      addAnswerTextColor: this.themeService.theme.palette.getPrimary(),
      errorTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      errorTextColor: this.themeService.theme.palette.getError(),
      optionPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      optionPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      questionInputTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      questionInputTextColor: this.themeService.theme.palette.getAccent600(),
      optionInputTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      optionInputTextColor: this.themeService.theme.palette.getAccent600(),
      width: "360px",
      height: "620px",
      border: "",
      borderRadius: "8px",
      background: this.themeService.theme.palette.getAccent900(),
    }
  }
  setComposerStyle(){
    let defaultStyle:MessageComposerStyle = new MessageComposerStyle({
      background:this.themeService.theme.palette.getAccent100(),
      border:`none`,
      height: "100%",
      width: "100%",
      borderRadius: "12px",
      attachIcontint: this.themeService.theme.palette.getAccent500(),
      sendIconTint: "#2fb5e9d1",
      emojiIconTint: this.themeService.theme.palette.getAccent500(),
      inputBackground: "transparent",
      inputBorder: "none",
      dividerTint: this.themeService.theme.palette.getAccent200(),
      textFont: fontHelper(this.themeService.theme.typography.subtitle1),
      textColor: this.themeService.theme.palette.getAccent(),
      ActionSheetSeparatorTint: this.themeService.theme.palette.getAccent200(),
      ActionSheetTitleColor: this.themeService.theme.palette.getAccent(),
      ActionSheetTitleFont: fontHelper(this.themeService.theme.typography.title1),
      ActionSheetLayoutModeIconTint: this.themeService.theme.palette.getPrimary(),
      emojiKeyboardTextFont:fontHelper(this.themeService.theme.typography.subtitle2),
      emojiKeyboardTextColor:this.themeService.theme.palette.getAccent400(),
      previewTitleFont:fontHelper(this.themeService.theme.typography.subtitle1),
      previewTitleColor:this.themeService.theme.palette.getAccent(),
      previewSubtitleFont:fontHelper(this.themeService.theme.typography.subtitle2),
      previewSubtitleColor:this.themeService.theme.palette.getAccent600(),
      closePreviewTint:this.themeService.theme.palette.getAccent500(),
      maxInputHeight:"100px"
    })
    this.messageComposerStyle = {...defaultStyle,...this.messageComposerStyle}
  }
  closePreview() {
    this.showPreview = false;
    this.inputRef?.nativeElement?.emptyInputField()
  }
}
type ComposerId = {parentMessageId : number | null, user : string | null, group : string | null};