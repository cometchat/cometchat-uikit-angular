import { CometChat } from "@cometchat-pro/chat";
import { CometChatMessageEvents, CometChatUIEvents, CometChatUIKitConstants, MessageStatus } from "uikit-resources-lerna";
import { IActiveChatChanged } from "uikit-resources-lerna";
import { CometChatSoundManager, SmartRepliesConfiguration, SmartRepliesStyle,CometChatUIKitUtility } from "uikit-utils-lerna";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class SmartReplyExtensionDecorator extends DataSourceDecorator {
  public configuration?:SmartRepliesConfiguration;
  private LISTENER_ID: string = "smartreply__listener";
  private activeUser!: CometChat.User;
  private activeGroup!: CometChat.Group;
  public currentMessage:CometChat.BaseMessage | null = null;
  public loggedInUser!:CometChat.User | null;
  constructor(dataSource:DataSource,configuration:SmartRepliesConfiguration = new SmartRepliesConfiguration({})){
  super(dataSource)
  this.configuration = configuration;
  this.addMessageListener();
  if(!this.configuration?.ccSmartRepliesClicked){
    this.configuration!.ccSmartRepliesClicked = this.sendReply
    }
}
sendReply = (reply:string, message:CometChat.BaseMessage,onError:((error:any)=>void) | null | undefined,customSoundForMessages:string = "", disableSoundForMessages:boolean = false)=>{
  let ReceiverType:string = this.activeUser  ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group
  if (reply && reply.trim().length > 0 &&  message) {
    let newMessage: CometChat.TextMessage;
    if (message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
      newMessage = new CometChat.TextMessage(
            message.getSender().getUid(),
            reply.trim(),
            ReceiverType
        );
        newMessage.setReceiver(this.activeUser);
    } else {
        const group: CometChat.Group = message.getReceiver() as CometChat.Group;
        newMessage = new CometChat.TextMessage(
            group.getGuid(),
            reply.trim(),
            ReceiverType
        );
        newMessage.setReceiver(this.activeGroup);
    }
    if (message.getParentMessageId() > 0) {
      newMessage.setParentMessageId(message.getParentMessageId());
    }
    newMessage.setCategory(CometChatUIKitConstants.MessageCategory.message as CometChat.MessageCategory);
    newMessage.setSender(this.loggedInUser!);
    newMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    newMessage.setMuid(CometChatUIKitUtility.ID());
    CometChatMessageEvents.ccMessageSent.next({
      message:newMessage,
      status:MessageStatus.inprogress
    })
    if (!disableSoundForMessages) {
      CometChatSoundManager.play(customSoundForMessages ?? CometChatSoundManager.Sound.outgoingMessage)
    }
CometChat.sendMessage(newMessage).then((message:CometChat.BaseMessage)=>{
  CometChatMessageEvents.ccMessageSent.next({
    message:message,
    status:MessageStatus.success
  })
})
.catch((error:any)=>{
  newMessage.setMetadata({
    error:true
  })
  CometChatMessageEvents.ccMessageSent.next({
    message:newMessage,
    status:MessageStatus.error
  })
})
}
}
private addMessageListener(): void {
CometChat.getLoggedinUser().then((user:CometChat.User | null)=>{
  this.loggedInUser = user
}).catch((error:CometChat.CometChatException)=>{
  console.log(error)
})
  CometChat.addMessageListener(this.LISTENER_ID, {
    onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
      if (textMessage != null) {
        if (
          textMessage.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user &&
          this.activeUser != null
        ) {
          if (
            textMessage.getSender() != null &&
            textMessage.getSender().getUid() != null &&
            this.activeUser.getUid() == textMessage.getSender().getUid()
          ) {
            CometChatUIEvents.ccShowPanel.next({
              configuration:this.configuration!,
              message:textMessage
            });
          }
        } else if (
          textMessage.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
          this.activeGroup != null
        ) {
          if (
            this.activeGroup.getGuid() != null &&
            this.activeGroup.getGuid() == textMessage.getReceiverId()
          ) {
            CometChatUIEvents.ccShowPanel.next({
              configuration:this.configuration!,
              message:textMessage
            });
          }
        }
      }
    },
  });
    CometChatUIEvents.ccActiveChatChanged.subscribe((data:IActiveChatChanged)=>{
      this.currentMessage = data.message!;
      this.activeUser = data.user!;
      this.activeGroup = data.group!;
      if (
        data.message != null && data.message.getType() == CometChatUIKitConstants.MessageTypes.text &&
        data.message.getSender() != null &&
        this.loggedInUser != null &&
        data.message.getSender().getUid() != null &&
        data.message.getSender().getUid() != this.loggedInUser.getUid()
      ) {
        CometChatUIEvents.ccShowPanel.next({
          configuration:this.configuration!,
          message:data.message!
        });
      }
    })
  CometChatMessageEvents.ccMessageSent.subscribe(()=>{
    CometChatUIEvents.ccHidePanel.next()
    this.currentMessage = null
  })
}
  override getId(): string {
    return "smartreply";
  }
}
