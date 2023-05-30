import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatMessageOption, CometChatUIKitConstants, localize, fontHelper } from "uikit-resources-lerna";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class ReactionExtensionDecorator extends DataSourceDecorator {
  constructor(dataSource:DataSource){
    super(dataSource)
  }
  public override getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): CometChatMessageOption[] {
    let options:CometChatMessageOption[] = super.getCommonOptions(loggedInUser,messageObject,theme,group)
    if(!this.checkIfOptionExist(options, CometChatUIKitConstants.MessageOption.reactToMessage)){
     let newOption:CometChatMessageOption = new CometChatMessageOption({
       id:CometChatUIKitConstants.MessageOption.reactToMessage,

       iconURL: "assets/Reactionsicon.svg",
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
    return "reactions";
  }

}
