import { Component, OnInit,  Input } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { inputData } from "../../../Shared/SDKDerivedComponents/CometChatDataItem/DataItemInterface";
import { CometChatTheme, localize, MessageHeaderConfiguration } from "../../../Shared";
import { styles } from "../../../Shared/Types/interface";
import { checkHasOwnProperty } from "../../../Shared/Helpers/CometChatHelper";
import { CometChatGroupEvents } from "../../CometChatGroupEvents.service";
import { joinGroupStyle } from "../interface";
import { CometChatWrapperComponent } from "../../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component";
/**
*
* CometChatJoinProtectedGroupComponent is used to enter password for password protected group
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-join-protected-group",
  templateUrl: "./cometchat-join-protected-group.component.html",
  styleUrls: ["./cometchat-join-protected-group.component.scss"],
})
export class CometChatJoinProtectedGroupComponent implements OnInit {
    /**
  * This properties will come from Parent.
  */
  @Input() messageHeaderConfiguration:MessageHeaderConfiguration = new MessageHeaderConfiguration({})
  @Input() title:string= localize("ENTER_GROUP_PASSWORD");
  @Input() passwordPlaceholderText:string= localize("ENTER_YOUR_PASSWORD");
  @Input() joinButtonText:string= localize("CONTINUE");
  @Input() style:joinGroupStyle={
    width: "100%",
    boxShadow:"none",
    height: "100%",
    background: "rgb(255, 255, 255)",
    border: "none",
    borderRadius: "none",
    titleTextFont: "700 22px Inter",
    titleTextColor: "rgba(20, 20, 20, 0.69)",
    errorTextFont: "500 15px Inter",
    errorTextColor: "red",
    passwordTextFont:"400 15px Inter",
    passwordTextColor:"rgb(20, 20, 20)",
    passwordPlaceholderTextFont:"400 15px Inter",
    passwordPlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
    passwordInputBackground:"rgba(20, 20, 20, 0.04)",
    passwordInputBorder: "none",
    passwordInputBorderRadius: "8px",
    passwordInputBoxShadow:"rgba(20, 20, 20, 0.04) 0px 0px 0px 1px",
    joinButtonTextFont:"600 15px Inter",
    joinButtonTextColor:"rgb(255, 255, 255)",
    joinButtonBackground:"rgb(51, 153, 255)",
    joinButtonBorderRadius:"8px"
  };

  @Input() group:CometChat.Group | null = null;

   /**
  * Properties for internal use
  */
  public headerStyle:styles ={
      height:"100%",
      width:"100%",
      border:"none",
      borderRadius:"8px",
      background:"white"
    };
  public theme:any = new CometChatTheme({})
  public isError: boolean = false;
  public errorText:any = localize("SOMETHING_WRONG");
  public password:string = "";
  public showBackButton: boolean = false;
  public isMobileView: boolean = false;
  public backButtonIconURL: string = "";
  public inputData!: inputData;
  constructor(private groupEvents:CometChatGroupEvents) {}
  ngOnInit() {
    
    this.setMessageHeaderConfiguration();
    this.setTheme() 
  }
  setTheme() {
    if (CometChatWrapperComponent.cometchattheme ) {
      this.theme = CometChatWrapperComponent.cometchattheme;
    }
    this.headerStyle.background = this.theme.palette.getBackground();
  }

  /**
   * @param  {MessageHeaderConfiguration} configuration
   * @param  {MessageHeaderConfiguration} defaultConfiguration?
   */
  setMessageHeaderConfiguration() {
    let defaultConfiguration:MessageHeaderConfiguration = new MessageHeaderConfiguration({});
    let configuration:MessageHeaderConfiguration = this.messageHeaderConfiguration;
    this.showBackButton = checkHasOwnProperty(configuration, "showBackButton") ? configuration?.showBackButton : defaultConfiguration!.showBackButton;
    this.isMobileView = checkHasOwnProperty(configuration, "isMobileView") ? configuration?.isMobileView : defaultConfiguration!.isMobileView;
    this.backButtonIconURL = configuration?.backButtonIconURL || defaultConfiguration!.backButtonIconURL;
    this.inputData = configuration?.inputData || defaultConfiguration!.inputData;
  }
  joinGroup(){
    let guid:string = this.group!.getGuid();
    let type:any = this.group!.getType();
    let password:string = this.password;
    try {
      CometChat.joinGroup(guid, type, password)
        .then((response:any) => {
          this.isError = false
          this.groupEvents.publishEvents(this.groupEvents.onGroupMemberJoin, response)
        })
        .catch((error:any) => {
          this.groupEvents.publishEvents(this.groupEvents.onError, error)
     
          this.isError = true
          this.errorText = error.message
        });
    } catch (error:any) {
      this.isError = true
      this.errorText = error
    }
  }
  /**
   * Props dependent styles of CometChatJoinGroup
   */
  styles:any={
    wrapperStyle:()=>{
      return{
        height:this.style.height,
        width:this.style.width,
        border:this.style.border,
        borderRadius:this.style.borderRadius,
        boxShadow:this.style.boxShadow,
        background:this.style.background
      }
    },
    titleStyle:()=>{
      return{
        font:this.style.titleTextFont,
        color:this.style.titleTextColor
      }
    },
    placeholderStyle:()=>{
      return{
        font:this.style.passwordPlaceholderTextFont,
        color:this.style.passwordPlaceholderTextColor,
        background:this.style.passwordInputBackground,
        border:this.style.passwordInputBorder,
        boxShadow:this.style.boxShadow,
        borderRadius:this.style.joinButtonBorderRadius
      }
    },
    buttonStyle:()=>{
      return{
        font:this.style.joinButtonTextFont,
        color:this.style.joinButtonTextColor,
        background:this.style.joinButtonBackground,
        borderRadius:this.style.joinButtonBorderRadius
      }
    },
    errorTextStyle:()=>{
      return {
        font:this.style.errorTextFont,
        color:this.style.errorTextColor,
      }
    },
  }
}
