import { Component, OnInit,  Input, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { AddMembersStyle,TitleAlignment,SelectionMode, UsersConfiguration, UsersStyle,CometChatUIKitUtility  } from 'uikit-utils-lerna';
import 'my-cstom-package-lit'
import {CometChatTheme, fontHelper, localize,CometChatOption, CometChatGroupEvents, CometChatUIKitConstants} from 'uikit-resources-lerna'
import  { AvatarStyle, ListItemStyle} from 'my-cstom-package-lit'
import { CometChatThemeService } from "../../CometChatTheme.service";
/**
*
* CometChatAddMembersComponentComponent is used to render group members to add
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-add-members",
  templateUrl: "./cometchat-add-members.component.html",
  styleUrls: ["./cometchat-add-members.component.scss"],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class CometChatAddMembersComponent implements OnInit {

  @Input() usersRequestBuilder!: CometChat.UsersRequestBuilder;
  @Input() searchRequestBuilder!: CometChat.UsersRequestBuilder;
  @Input() subtitleView!: TemplateRef<any>;
  @Input() listItemView!: TemplateRef<any>;
  @Input() disableUsersPresence:boolean = false;
  @Input() menu!: TemplateRef<any>;
  @Input()   options!: ((member:CometChat.User)=>CometChatOption[]) | null;
  @Input() backButtonIconURL:string = "assets/backbutton.svg"
  @Input() closeButtonIconURL:string = "assets/close2x.svg"
  @Input() showBackButton:boolean=true;
  @Input() hideSeparator: boolean = false;
  @Input() selectionMode: SelectionMode = SelectionMode.multiple;
  @Input() searchPlaceholder: string = "Search Members";
  @Input() hideError: boolean = false;
  @Input() searchIconURL: string = "assets/search.svg";
  @Input() hideSearch: boolean = false;
  @Input() title: string = localize("ADD_MEMBERS");
  @Input() onError:((error:any)=>void) | null = (error:any)=>{
    console.log(error)
  }
  @Input() onBack!:()=>void;
  @Input() onClose!:()=>void;
  @Input() onSelect!: (user:CometChat.User)=>void;

  @Input() buttonText:string = localize("ADD_MEMBERS");
  @Input() group!:CometChat.Group;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() listItemStyle:ListItemStyle = {}
  @Input() showSectionHeader: boolean = false;
  @Input() sectionHeaderField: string = "name";
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_GROUPS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() onAddMembersButtonClick!:(guid:string, members:CometChat.User[])=>void;
  @Input() titleAlignment: TitleAlignment = TitleAlignment.center;
  titleAlignmentEnum:typeof TitleAlignment = TitleAlignment
  selectionmodeEnum: typeof SelectionMode = SelectionMode;
  @Input() addMembersStyle: AddMembersStyle = {};

  loggedInUser!:CometChat.User | null;
  actionMessagesList:CometChat.Action[] = []
  constructor(private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {  }
  addMemberButtonStyle:any = {
    height:"100%",
    width:"100%",
    background:"rgb(51, 153, 255)",
    padding:"8px",
    buttonTextColor:"white",
    buttonTextFont:"",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    border:"none",
    borderRadius:"8px"
}
  searchKeyword: string = "";
  public usersRequest: any;
  public timeout: any;
  public usersList: CometChat.User[] = [];
  public userListenerId: string = "userlist_" + new Date().getTime();
  usersStyle: UsersStyle = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "",
    searchBackground: "#efefef",
    onlineStatusColor: "",
    separatorColor: "rgb(222 222 222 / 46%)",
    sectionHeaderTextFont: "",
    sectionHeaderTextColor: ""
  };
  membersList:any[] = [];
  addedMembers:CometChat.GroupMember[] = []
  ngOnInit(): void {
    this.setUsersStyle()
    this.setAddMembersStyle();
    this.membersList = []
    this.addedMembers = []
    this.actionMessagesList = []

    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      this.loggedInUser = user;
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
  }
  /**
   * @param  {string} uid
   */
  addRemoveUsers = (user:CometChat.User)=>{
 if(this.onSelect){
   this.onSelect(user)
 }

 else{
  let key =  this.membersList.findIndex(
    (m:any) => m.getUid() === user.getUid()
  );
  if(key >= 0){
    this.membersList.splice(key,1)
  }
  else{
    let member:CometChat.GroupMember = new CometChat.GroupMember(user.getUid(), CometChatUIKitConstants.groupMemberScope.participant)
    member.setName(user.getName())
    member.setGuid(this.group.getGuid())

    this.membersList.push(member)
  }
 }
 this.ref.detectChanges()
  }
  closeClicked(){
    if(this.onClose){
      this.onClose()
    }
  }
  backClicked(){
    if(this.onBack){
      this.onBack()
    }
  }
  addMembersToGroup = ()=>{
    if(this.group && this.membersList.length > 0){
      if(this.onAddMembersButtonClick){
        this.onAddMembersButtonClick(this.group.getGuid(), this.membersList)
        this.ref.detectChanges()
        return
      }
      else{
        CometChat.addMembersToGroup(this.group.getGuid(), this.membersList, []).then((response:any)=>{
          for (const key in response) {
            if (response.hasOwnProperty(key) && response[key] === "success") {

              const matchingUser:CometChat.GroupMember = this.membersList.find((user:CometChat.User) => user.getUid() === key);
              if (matchingUser) {
                this.createActionMessage(matchingUser)
                this.addedMembers.push(matchingUser)
              }

            }
          }
          this.group.setMembersCount(this.group.getMembersCount() + this.addedMembers?.length || 0)
          CometChatGroupEvents.ccGroupMemberAdded.next(
            {
              messages:this.actionMessagesList,
              usersAdded:this.addedMembers,
              userAddedIn:this.group,
              userAddedBy:this.loggedInUser!

            }
          )
          this.membersList = []
          this.addedMembers = []
          this.actionMessagesList = []
          if(this.onBack){
            this.onBack()
          }
          this.ref.detectChanges()
        })
        .catch((err:any)=>{
          console.log(err)
          this.membersList = [];
          this.ref.detectChanges()
        })
      }
    }
    else{
      return
    }
  }
  createActionMessage(actionOn:CometChat.GroupMember){
    let actionMessage:CometChat.Action  = new CometChat.Action(this.group.getGuid(),CometChatUIKitConstants.MessageTypes.groupMember,CometChatUIKitConstants.MessageReceiverType.group,CometChatUIKitConstants.MessageCategory.action as any)
    actionMessage.setAction(CometChatUIKitConstants.groupMemberAction.ADDED)
    actionMessage.setActionBy(this.loggedInUser!)
    actionMessage.setActionFor(this.group)
    actionMessage.setActionOn(actionOn)
    actionMessage.setReceiver(this.group)
    actionMessage.setSender(this.loggedInUser!)
    actionMessage.setConversationId("group_"+ this.group.getGuid())
    actionMessage.setMuid(CometChatUIKitUtility.ID())
    actionMessage.setMessage(`${this.loggedInUser?.getName()} added ${actionOn.getUid()}`)
    actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp())

    this.actionMessagesList.push(actionMessage)
  }

  setAddMembersStyle(){

    let defaultStyle:AddMembersStyle = new AddMembersStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`none`,
      titleTextFont:fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:this.themeService.theme.palette.getAccent(),
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      separatorColor:this.themeService.theme.palette.getAccent400(),
      width: "100%",
      height: "100%",
      borderRadius: "none",
      searchPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      searchPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
      searchTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      searchTextColor: this.themeService.theme.palette.getAccent400(),
      searchIconTint: this.themeService.theme.palette.getAccent600(),
      searchBorder: `1px solid ${this.themeService.theme.palette.getAccent100()}`,
      searchBorderRadius: "8px",
      searchBackground: this.themeService.theme.palette.getAccent50(),
      closeButtonIconTint:this.themeService.theme.palette.getPrimary(),
      backButtonIconTint:this.themeService.theme.palette.getPrimary(),
     addMembersButtonBackground:this.themeService.theme.palette.getPrimary(),
     addMembersButtonTextColor:this.themeService.theme.palette.getAccent900("light"),
     addMembersButtonTextFont:fontHelper(this.themeService.theme.typography.subtitle1),
     padding:"0 100px"
    })
    this.addMembersStyle = {...defaultStyle,...this.addMembersStyle}
    this.addMemberButtonStyle.background = this.addMembersStyle.addMembersButtonBackground;
    this.addMemberButtonStyle.buttonTextFont = this.addMembersStyle.addMembersButtonTextFont;
    this.addMemberButtonStyle.buttonTextColor = this.addMembersStyle.addMembersButtonTextColor;
  }
  setUsersStyle(){
    let defaultStyle:UsersStyle = new UsersStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:"none",
      titleTextFont:fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:this.themeService.theme.palette.getAccent(),
      emptyStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor:this.themeService.theme.palette.getAccent600(),
      errorStateTextFont:fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor:this.themeService.theme.palette.getAccent600(),
      loadingIconTint:this.themeService.theme.palette.getAccent600(),
      separatorColor:this.themeService.theme.palette.getAccent400(),
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      searchIconTint:this.themeService.theme.palette.getAccent600(),
      searchPlaceholderTextColor:this.themeService.theme.palette.getAccent600(),
      searchBackground:this.themeService.theme.palette.getAccent100(),
      searchPlaceholderTextFont:fontHelper(this.themeService.theme.typography.text3),
      searchTextColor:this.themeService.theme.palette.getAccent600(),
      searchTextFont:fontHelper(this.themeService.theme.typography.text3)
    })
    this.usersStyle = {...defaultStyle,...this.addMembersStyle}
  }

  // styles
  backButtonStyle = ()=> {
    return {
     height:"24px",
     width:"24px",
     border:"none",
     borderRadius:"0",
     background:"transparent",
      buttonIconTint:this.addMembersStyle.backButtonIconTint || this.themeService.theme.palette.getPrimary()
    }
  }
  closeButtonStyle = ()=> {
    return {
      height:"24px",
      width:"24px",
      border:"none",
      borderRadius:"0",
      background:"transparent",
      buttonIconTint:this.addMembersStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
    }
  }

  wrapperStyle = ()=>{
    return {
      height: this.addMembersStyle.height,
      width: this.addMembersStyle.width,
      background: this.addMembersStyle.background,
      border: this.addMembersStyle.border,
      borderRadius: this.addMembersStyle.borderRadius
    }
  }
  addMembersStyles = ()=>{
    return {
      padding:this.addMembersStyle.padding
    }
  }
}
