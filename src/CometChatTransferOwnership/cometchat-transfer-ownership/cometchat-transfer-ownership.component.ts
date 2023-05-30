import { Component, OnInit,  Input, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import {AvatarStyle, BaseStyle, ListItemStyle} from 'my-cstom-package-lit'
import { CometChatOption, localize, TitleAlignment, SelectionMode, CometChatGroupEvents, CometChatUIKitConstants, fontHelper } from "uikit-resources-lerna";
import { TransferOwnershipStyle, GroupMembersStyle } from "uikit-utils-lerna";
import { CometChatThemeService } from "../../CometChatTheme.service";

/**
*
* CometChatTransferOwnershipComponent is used to render users list to transfer wonership
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-transfer-ownership",
  templateUrl: "./cometchat-transfer-ownership.component.html",
  styleUrls: ["./cometchat-transfer-ownership.component.scss"],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class CometChatTransferOwnershipComponent implements OnInit {
  @Input() groupMemberRequestBuilder!: CometChat.GroupMembersRequestBuilder;
  @Input() searchRequestBuilder!: CometChat.GroupMembersRequestBuilder;

  @Input() subtitleView!: TemplateRef<any>;
  @Input() listItemView!: TemplateRef<any>;
  @Input() disableUsersPresence: boolean = false;
  @Input()   options!: ((member:CometChat.GroupMember)=>CometChatOption[]) | null;
  @Input() closeButtonIconURL: string = "assets/close2x.svg"
  @Input() hideSeparator: boolean = false;
  @Input() searchPlaceholder: string = localize("SEARCH");
  @Input() searchIconURL: string = "assets/search.svg";
  @Input() hideSearch: boolean = true;
  @Input() title: string = localize("TRANSFER_OWNERSHIP");
  @Input() onError:((error:any)=>void) | null = (error:any)=>{
    console.log(error)
  }
  @Input() onClose!:()=>void;
  @Input() onTransferOwnership!:(member:CometChat.GroupMember)=>void;
  @Input() group!: CometChat.Group;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_GROUPS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() statusIndicatorStyle: any = {
    height: "10px",
    width: "10px",
    borderRadius: "16px",
    border:""
  };
  @Input() transferOwnershipStyle:TransferOwnershipStyle = {
    width: "360px",
    height: "650px",

    borderRadius: "8px",
  }
  @Input() transferButtonText:string = localize("TRANSFER_OWNERSHIP")
  @Input() cancelButtonText:string = localize("CANCEL")
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "32px",
    height: "32px",

  };
  @Input() groupMemberStyle: GroupMembersStyle = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "8px",

    padding:"0"
  };
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",

    separatorColor: "rgb(222 222 222 / 46%)"
  };

  @Input() titleAlignment: TitleAlignment = TitleAlignment.center;
   public selectionMode: SelectionMode = SelectionMode.single;
   public showBackButton: boolean = false;
   public selectedMember!: CometChat.GroupMember | null;
   public loggedInUser!: CometChat.User | null;
   public selectedUser!:CometChat.User;
   constructor(private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
   }
   public  transferButtonStyle:any = {
    height:"100%",
    width:"100%",
    background:"rgb(51, 153, 255)",
    padding:"8px",
    buttonTextColor:"white",
    buttonTextFont:"600 15px Inter, sans-serif",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    border:"none",
    borderRadius:"8px"
}
   public cancelButtonStyle:any = {
  height:"100%",
  width:"100%",
  background:"white",
  padding:"8px",
  buttonTextColor:"black",
  buttonTextFont:"600 15px Inter, sans-serif",
  display:"flex",
  justifyContent:"center",
  alignItems:"center",
  border:"1px solid #e0e0e0",
  borderRadius:"8px"
}
  ngOnInit(): void {
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      this.loggedInUser = user
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    this.setThemeStyle()
  }
  onOwnerSelected = (member:CometChat.GroupMember)=>{
    this.selectedMember = member
  }
  onTransferClick = ()=>{
CometChat.getUser(this.selectedMember?.getUid()).then((user:CometChat.User)=>{
this.selectedUser = user
})
.catch((error:any)=>{
  if(this.onError){
    this.onError(error)
  }
})
    if(this.onTransferOwnership){
      this.onTransferOwnership(this.selectedMember!)
      this.selectedMember = null
    }
    else{
if(this.selectedMember){
  CometChat.transferGroupOwnership(this.group.getGuid(),this.selectedMember!.getUid()).then((response:string)=>{
    this.group.setOwner(this.selectedMember!.getUid())
   CometChatGroupEvents.ccOwnershipChanged.next(
    {
      group:this.group,
      newOwner:this.selectedMember!
       }
   )
    this.selectedMember = null
  })
  .catch((error:any)=>{
    if(this.onError){
      this.onError(error)
    }
  })
}
    }
  }
  closeClicked =()=>{
    if(this.onClose){
      this.onClose()
    }
  }
  setThemeStyle() {
    this.setGroupMembersStyle()
    this.setListItemStyle();
    this.setAvatarStyle();
    this.setownershipStyle();
    this.setStatusStyle();
    this.transferButtonStyle.buttonTextFont = this.transferOwnershipStyle.transferButtonTextFont || fontHelper(this.themeService.theme.typography.subtitle1);
    this.transferButtonStyle.buttonTextColor = this.transferOwnershipStyle.transferButtonTextColor || this.themeService.theme.palette.getAccent900();
    this.transferButtonStyle.background = this.themeService.theme.palette.getPrimary();
    this.cancelButtonStyle.background = this.themeService.theme.palette.getSecondary();
    this.cancelButtonStyle.buttonTextFont = this.transferOwnershipStyle.cancelButtonTextFont || fontHelper(this.themeService.theme.typography.subtitle1);
    this.cancelButtonStyle.buttonTextColor = this.transferOwnershipStyle.cancelButtonTextColor || this.themeService.theme.palette.getAccent();
    this.ref.detectChanges();
  }
  setListItemStyle(){
    let defaultStyle:ListItemStyle = new ListItemStyle({
      height: "45px",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: "transparent",
      borderRadius: "0",
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      titleColor: this.themeService.theme.palette.getAccent(),
      border: "none",
      separatorColor:this.themeService.theme.palette.getAccent200(),
      hoverBackground:"transparent"
    })
    this.listItemStyle = {...defaultStyle,...this.listItemStyle}
  }
  setGroupMembersStyle(){
    let defaultStyle:GroupMembersStyle = new GroupMembersStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
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
      searchIconTint:this.themeService.theme.palette.getAccent600(),
      searchPlaceholderTextColor:this.themeService.theme.palette.getAccent600(),
      searchBackground:this.themeService.theme.palette.getAccent100(),
      searchPlaceholderTextFont:fontHelper(this.themeService.theme.typography.text3),
      searchTextColor:this.themeService.theme.palette.getAccent600(),
      searchTextFont:fontHelper(this.themeService.theme.typography.text3),
      searchBorderRadius:"8px",
      closeButtonIconTint:this.themeService.theme.palette.getPrimary(),
      backButtonIconTint:this.themeService.theme.palette.getPrimary(),
      padding:"0 100px",

    })
    this.groupMemberStyle = {...defaultStyle,...this.groupMemberStyle}

    this.ref.detectChanges();
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
  setStatusStyle(){
    let defaultStyle:BaseStyle = {
        height: "10px",
        width:"10px",
        border:"none",
        borderRadius:"24px",

    }
    this.statusIndicatorStyle = {...defaultStyle,...this.statusIndicatorStyle}
  }
  setownershipStyle(){
    let defaultStyle:TransferOwnershipStyle = new TransferOwnershipStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
      MemberScopeTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      MemberScopeTextColor:this.themeService.theme.palette.getAccent600(),
      transferButtonTextFont :fontHelper(this.themeService.theme.typography.title2),
      transferButtonTextColor :this.themeService.theme.palette.getAccent("dark"),
      cancelButtonTextFont :fontHelper(this.themeService.theme.typography.title2),
      cancelButtonTextColor :this.themeService.theme.palette.getAccent("light"),
      width: "360px",
      height: "650px",
      borderRadius: "8px",
    })
    this.transferOwnershipStyle = {...defaultStyle,...this.transferOwnershipStyle}
  }
  membersStyle = () => {
    return {
      height: this.groupMemberStyle.height,
      width: this.groupMemberStyle.width,
      background: this.groupMemberStyle.background,
      border: this.groupMemberStyle.border,
      borderRadius: this.groupMemberStyle.borderRadius
    }
  }
  wrapperStyle = () => {
    return {
      height: this.transferOwnershipStyle.height || "80vh",
      width: this.transferOwnershipStyle.width || "360px",
      background: this.transferOwnershipStyle.background,
      border: this.transferOwnershipStyle.border,
      borderRadius: this.transferOwnershipStyle.borderRadius
    }
  }
  getScopeStyle = () => {
    return {
      textFont: this.transferOwnershipStyle.MemberScopeTextFont,
      textColor: this.transferOwnershipStyle.MemberScopeTextColor
    }
  }
}
