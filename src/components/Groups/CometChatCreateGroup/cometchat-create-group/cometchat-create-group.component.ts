import { Component, OnInit, Input } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, fontHelper, localize } from "../../../Shared";
import { GroupsConstants, GroupType } from "../../../Shared/Constants/UIKitConstants";
import { CometChatGroupEvents } from "../../CometChatGroupEvents.service";
import { createGroupStyle } from "../interface";
/**
*
* CometChatCreateGroup is a  modal and is used to create a new group..
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-create-group",
  templateUrl: "./cometchat-create-group.component.html",
  styleUrls: ["./cometchat-create-group.component.scss"],
})
export class CometChatCreateGroupComponent implements OnInit {
  /**
  * This properties will come from Parent.
  */
  @Input() title: string = localize("NEW__GROUP");
  @Input() createButtonText:string= localize("CREATE_GROUP");
  @Input() namePlaceholderText:string=localize("NAME");
  @Input() passwordPlaceholderText:string=localize("PASSWORD");
  @Input() onClose:any;
  @Input() onCreateGroup:any;
  @Input() closeButtonIconURL:string="assets/resources/close2x.svg";
  @Input() hideCloseButton:boolean = false;
  @Input() theme: CometChatTheme = new CometChatTheme({});
  @Input() style: createGroupStyle = {
    width: "100%",
    height: "100%",
    background: "rgb(255, 255, 255)",
    border: "none",
    borderRadius: "8px",
    boxShadow:"rgba(20, 20, 20, 0.2) 0px 16px 32px 0px",
    groupTypeTextFont: "500 13px Inter",
    groupTypeBorder:"1px solid rgb(178 178 178 / 60%)",
    groupTypeTextColor: "black",
    groupTypeTextBackground:"transparent",
    groupTypeBackground:"rgba(20, 20, 20, 0.08)",
    groupTypeTextActiveBackground:"rgb(255, 255, 255)",
    groupTypeTextActiveBoxShadow:"rgba(20, 20, 20, 0.12) 0 3px 8px 0",
    groupTypeTextActiveBorderRadius:"8px",
    groupTypeTextBoxShadow:"none",
    groupTypeTextBorderRadius:"0",
    closeIconTint:"rgb(51, 153, 255)",
    titleTextFont: "700 22px Inter",
    titleTextColor: "rgb(20, 20, 20)",
    errorTextFont: "500 15px Inter",
    errorTextBackground:"rgba(255, 59, 48, 0.1)",
    errorTextBorderRadius:"8px",
    errorTextBorder:"none",
    errorTextColor: "rgb(255, 59, 48)",
    namePlaceholderTextFont:"400 15 Inter",
    namePlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
    nameInputBackground:"rgba(20, 20, 20, 0.04)",
    nameTextFont:"400 15 Inter",
    nameTextColor:"rgb(20, 20, 20)",
    nameInputBorder: "none",
    nameInputBorderRadius: "8px",
    nameInputBoxShadow:"rgba(20, 20, 20, 0.04) 0 0 0 1px",
    passwordPlaceholderTextFont:"400 15 Inter",
    passwordPlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
    passwordInputBackground:"rgba(20, 20, 20, 0.04)",
    passwordInputBorder: "none",
    passwordInputBorderRadius: "8px",
    passwordInputBoxShadow:"rgba(20, 20, 20, 0.04) 0 0 0 1px",
    passwordTextFont:"400 15 Inter",
    passwordTextColor:"rgb(20, 20, 20)",
    createGroupButtonTextFont:"600 15px Inter",
    createGroupButtonTextColor:"rgb(255, 255, 255)",
    createGroupButtonBackground:"rgb(51, 153, 255)",
    createGroupButtonBorderRadius:"8px"
  };
   /**
  * Properties for internal use
  */
  public objectKeys:any = Object.keys;
  public groupTypes:any = {
    public: GroupType.public,
    private: GroupType.private,
    password: GroupType.password,
  }
  public activeTab:string = "";
  public error: any = null;
  public errorText:string="";
  public passwordInput: boolean = false;
  public groupName:string="";
  public groupPassword:string="";
  public type: string = "";
  constructor(private groupEvents:CometChatGroupEvents) {}
  ngOnInit() {}
  /**
   * @param  {string} type
   */
  setActiveTab(type:string){
    this.resetGroupData()
    this.activeTab = type;
   this.passwordInput = type == GroupType.password  ? true : false;
  }
  /**
   * @param  {string} type
   * @param  {any} event
   */
  handleMouseHover(type:string,event:any){
    this.type = event.type == "mouseenter" ? type : "";
  }
  /**
   * Validates all the group details that were entered before creating the group
   * @param
   */
  validate() {
      const groupName = this.groupName.trim();
      const groupType = this.activeTab.trim();
      if (!groupName) {
        this.error = localize("GROUP_NAME_BLANK");
        return false;
      }
      if (!groupType) {
        this.error = localize("GROUP_TYPE_BLANK");
        return false;
      }
      if (groupType === GroupsConstants.PROTECTED_GROUP) {
        const password = this.groupPassword;
        if (!password.length) {
          this.error = localize("GROUP_PASSWORD_BLANK");
          return false;
        }
      }
      return true;
  };
  /**
   * If the Group Data is successfully validated , below function creates the group
   * @param
   */
   createGroup(): boolean {
    try {
      if (!this.validate()) {
        return false;
      }
      if(this.onCreateGroup){
        this.onCreateGroup();
        return false;
      }
      let groupType = this.activeTab.trim();
      let password = this.groupPassword;
      let guid = GroupsConstants.GROUP_ + new Date().getTime();
      let name = this.groupName.trim();
      let type = GroupType.public;
      switch (groupType) {
        case GroupType.public:
          type = GroupType.public;
          break;
        case GroupType.private:
          type = GroupType.private;
          break;
        case GroupType.password:
          type = GroupType.password;
          break;
        default:
          break;
      }
      let group = new CometChat.Group(guid, name, type, password);
      CometChat.createGroup(group)
        .then((group) => {
          this.closeCreateGroupView()
          this.resetGroupData();
          this.groupEvents.publishEvents(this.groupEvents.onGroupCreate, group)
        })
        .catch((error:any) => {
          this.groupEvents.publishEvents(this.groupEvents.onError, error)
          this.error = error.message;
        })
    } catch (error:any) {
    }
    return true;
  }
  closeCreateGroupView() {
    if(this.onClose){
      this.resetGroupData();
      this.onClose();
    }
  }
  /**
   * Resets all the Group creation form data to initial values
   * @param
   */
  resetGroupData() {
    try {
      this.error = null;
      this.passwordInput = false;
      this.groupName = "";
      this.type = "";
      this.groupPassword = "";
      this.activeTab = ""
    } catch (error:any) {
    }
  }
    /**
   * Props dependent styles of CometChatCreateGroup
   */
  styles:any = {
    closeIconStyle:()=>{
      return{
       WebkitMask: `url(${this.closeButtonIconURL}) center center no-repeat`,
       background:this.style.closeIconTint || this.theme.palette.getPrimary()
      }
    },
    groupTypeStyle:(type:string)=>{
      return {
        font:this.style.groupTypeTextFont || fontHelper(this.theme.typography.text2),
        color:this.style.groupTypeTextColor || this.theme.palette.getAccent(),
         background: this.activeTab == type || this.type == type ? this.style.groupTypeTextActiveBackground || this.theme.palette.getBackground():  this.style.groupTypeTextBackground,
         boxShadow: this.activeTab == type || this.type == type? this.style.groupTypeTextActiveBoxShadow || `${this.theme.palette.getAccent100()} 0px 3px 1px 0` : this.style.groupTypeTextBoxShadow,
         borderRadius:this.activeTab == type || this.type == type? this.style.groupTypeTextActiveBorderRadius :this.style.groupTypeTextBorderRadius,
         borderRight:  this.style.groupTypeBorder
      }
    },
    tabListStyle:()=>{
      return{
        background:this.style.groupTypeBackground || this.theme.palette.getAccent100(),
        borderRadius:this.style.borderRadius
      }
    },
    createButtonStyle:()=>{
      return{
        font:this.style.createGroupButtonTextFont || fontHelper(this.theme.typography.title2),
        color:this.style.createGroupButtonTextColor || this.theme.palette.getAccent900("light"),
        background:this.style.createGroupButtonBackground || this.theme.palette.getPrimary(),
        borderRadius:this.style.createGroupButtonBorderRadius
      }
    },
    passwordInputStyle:()=>{
      return{
        color:this.style.passwordTextColor || this.theme.palette.getAccent(),
        font:this.style.passwordTextFont || fontHelper(this.theme.typography.subtitle2),
        boxShadow:this.style.passwordInputBoxShadow || `${this.theme.palette.getAccent50()} 0px 0px 0px 1px`,
        background:this.style.passwordInputBackground || this.theme.palette.getAccent50(),
        border:this.style.passwordInputBorder,
        borderRadius:this.style.passwordInputBorderRadius
      }
    },
    nameInputStyle:()=>{
      return{
        color:this.style.nameTextColor ||  this.theme.palette.getAccent(),
        font:this.style.nameTextFont || fontHelper(this.theme.typography.subtitle2),
        boxShadow:this.style.nameInputBoxShadow || `${this.theme.palette.getAccent50()} 0px 0px 0px 1px`,
        background:this.style.nameInputBackground || this.theme.palette.getAccent50(),
        border:this.style.nameInputBorder,
        borderRadius:this.style.nameInputBorderRadius,
      }
    },
    titleStyle:()=>{
      return{
        color:this.style.titleTextColor || this.theme.palette.getAccent(),
        font:this.style.titleTextFont || fontHelper(this.theme.typography.heading),
      }
    },
    errorTextStyle:()=>{
      return{
        background:this.style.errorTextBackground || this.theme.palette.getAccent50(),
        border:this.style.errorTextBorder,
        borderRadius:this.style.errorTextBorderRadius,
      }
    },
    wrapperStyle:()=>{

      return{
        border:this.style.border,
        borderRadius:this.style.borderRadius,
        height:this.style.height,
        width:this.style.width,
        background:this.style.background || this.theme.palette.getBackground(),
        boxShadow:this.style.boxShadow || `${this.theme.palette.getAccent50()} 0px 0px 0px 1px`
      }
    }
  }
}
