import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatMessageTemplate, CometChatMessageComposerAction, fontHelper, CometChatUIKitConstants, localize } from "uikit-resources-lerna";
import { CollaborativeWhiteboardConfiguration, CollaborativeWhiteboardConstants } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";

export class CollaborativeWhiteBoardExtensionDecorator extends DataSourceDecorator {
   private configuration!:CollaborativeWhiteboardConfiguration;
    constructor(dataSource: DataSource, configuration?: CollaborativeWhiteboardConfiguration) {
        super(dataSource);
        this.configuration = configuration!;
    }

    override getAllMessageTypes(): string[] {
        const types = super.getAllMessageTypes();
        if (!types.includes(CollaborativeWhiteboardConstants.extension_whiteboard)) {
            types.push(CollaborativeWhiteboardConstants.extension_whiteboard);
        }
        return types;
    }
    override getId(): string {
        return "collaborativewhiteboard";
      }

    override getAllMessageCategories(): string[] {
        const categories = super.getAllMessageCategories();
        if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
            categories.push(CometChatUIKitConstants.MessageCategory.custom);
        }
        return categories;
    }
    checkIfTemplateExist(template:CometChatMessageTemplate[], type:string):boolean{
        return template.some(obj => obj.type === type)
      }
    override getAllMessageTemplates(): CometChatMessageTemplate[] {
        const templates = super.getAllMessageTemplates();
        if(!this.checkIfTemplateExist(templates,CollaborativeWhiteboardConstants.extension_whiteboard)){
          templates.push(this.getWhiteBoardTemplate())
           }
             return templates
    }
    getWhiteBoardTemplate():CometChatMessageTemplate{
    return new CometChatMessageTemplate({
      type:CollaborativeWhiteboardConstants.extension_whiteboard,
      category:CometChatUIKitConstants.MessageCategory.custom,
      options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group)=>{
        return ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group)
       }

    })
    }
   override getAttachmentOptions(theme: CometChatTheme = new CometChatTheme({}),user?:CometChat.User,group?:CometChat.Group, id?: any) {
    if (!id?.parentMessageId) {
        let receiverType:string = user  ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group
         let receiverId:string | undefined =  user  ? user.getUid() : group?.getGuid()
        const messageComposerActions:CometChatMessageComposerAction[] = super.getAttachmentOptions(theme,user,group,id);
        let newAction:CometChatMessageComposerAction = new CometChatMessageComposerAction({
            id:CollaborativeWhiteboardConstants.whiteboard,
            title:localize("COLLABORATIVE_WHITEBOARD"),
            iconURL:"assets/collaborativewhiteboard.svg",
            iconTint:theme.palette.getAccent700(),
            titleColor:theme.palette.getAccent600(),
            titleFont:fontHelper(theme.typography.subtitle1),
            background:theme.palette.getAccent100(),
            onClick:()=>{
                CometChat.callExtension(CollaborativeWhiteboardConstants.whiteboard, CollaborativeWhiteboardConstants.post, CollaborativeWhiteboardConstants.v1_create, {
                    receiver: receiverId,
                    receiverType: receiverType,
                  })
                    .then((res:any) => {

                    })
                    .catch((error:any) => {
                      console.log(error)
                    });
            }

        })
        messageComposerActions.push(newAction)
        return messageComposerActions;
    } else {
        return super.getAttachmentOptions(theme, user,group, id);
    }
   }
   override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
    const message: CometChat.BaseMessage | undefined = conversation.getLastMessage();
    if (message != null && message.getType() == CollaborativeWhiteboardConstants.extension_whiteboard && message.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
      return localize("CUSTOM_MESSAGE_WHITEBOARD");
    } else {
      return super.getLastConversationMessage(conversation,loggedInUser);
    }
  }


  }

