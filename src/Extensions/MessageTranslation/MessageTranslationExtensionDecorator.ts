import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatMessageOption, CometChatUIKitConstants, fontHelper, localize } from "uikit-resources-lerna";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { MessageTranslationConfiguration } from "uikit-utils-lerna";
export class MessageTranslationExtensionDecorator extends DataSourceDecorator {
  public configuration?:MessageTranslationConfiguration;
  constructor(dataSource:DataSource,configuration:MessageTranslationConfiguration = new MessageTranslationConfiguration({})){
    super(dataSource)
    this.configuration = configuration;

  }
 public override getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
     let options:CometChatMessageOption[] = super.getTextMessageOptions(loggedInUser,messageObject,theme,group)
     if(!this.checkIfOptionExist(options, CometChatUIKitConstants.MessageOption.translateMessage)){
      let newOption:CometChatMessageOption = new CometChatMessageOption({
        id:CometChatUIKitConstants.MessageOption.translateMessage,
        title: localize("TRANSLATE_MESSAGE"),
        iconURL: "assets/translation.svg",
        onClick: null,
        iconTint: theme.palette.getAccent600(),
        backgroundColor: "transparent",
        titleFont: fontHelper(theme.typography.subtitle1),
        titleColor: theme.palette.getAccent600()
      })
      options.push(newOption)
     }


       return options

 }
   checkIfOptionExist(template:CometChatMessageOption[], id:string):boolean{
        return template.some(obj => obj.id === id)
      }
  override getId(): string {
    return "messagetranslation";
  }
}
