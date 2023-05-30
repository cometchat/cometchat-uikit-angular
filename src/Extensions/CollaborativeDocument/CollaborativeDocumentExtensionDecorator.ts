import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatMessageTemplate, CometChatMessageComposerAction, fontHelper, CometChatUIKitConstants, localize } from "uikit-resources-lerna";
import { CollaborativeDocumentConfiguration, CollaborativeDocumentConstants } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class CollaborativeDocumentExtensionDecorator extends DataSourceDecorator {
   private configuration!:CollaborativeDocumentConfiguration;
    constructor(dataSource: DataSource, configuration?: CollaborativeDocumentConfiguration) {
        super(dataSource);
        this.configuration = configuration!;
    }
    override getAllMessageTypes(): string[] {
        const types = super.getAllMessageTypes();
        if (!types.includes(CollaborativeDocumentConstants.extension_document)) {
            types.push(CollaborativeDocumentConstants.extension_document);
        }
        return types;
    }
    override getId(): string {
        return "collaborativedocument";
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
        if(!this.checkIfTemplateExist(templates,CollaborativeDocumentConstants.extension_document)){
             templates.push(this.getDocumentTemplate())
           }

             return templates

    }
    getDocumentTemplate():CometChatMessageTemplate{
    return new CometChatMessageTemplate({
      type:CollaborativeDocumentConstants.extension_document,
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
            id:CollaborativeDocumentConstants.document,
            title:localize("COLLABORATIVE_DOCUMENT"),
            iconURL:"assets/collaborativedocument.svg",
            iconTint:theme.palette.getAccent700(),
            titleColor:theme.palette.getAccent600(),
            titleFont:fontHelper(theme.typography.subtitle1),
            background:theme.palette.getAccent100(),
            onClick:()=>{
                CometChat.callExtension(CollaborativeDocumentConstants.document, CollaborativeDocumentConstants.post, CollaborativeDocumentConstants.v1_create, {
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
    if (message != null && message.getType() == CollaborativeDocumentConstants.extension_document && message.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
      return localize("CUSTOM_MESSAGE_DOCUMENT");
    } else {
      return super.getLastConversationMessage(conversation,loggedInUser);
    }
  }
  }
