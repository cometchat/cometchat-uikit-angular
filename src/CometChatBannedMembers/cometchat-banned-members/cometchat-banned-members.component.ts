import { Component, OnInit,  Input, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { Subscription } from "rxjs";
import { BannedMembersStyle, SelectionMode,BaseStyle,States, TitleAlignment, ListStyle,CometChatUIKitUtility  } from 'uikit-utils-lerna';
import {CometChatTheme, fontHelper, localize,CometChatOption, CometChatGroupEvents, CometChatUIKitConstants, IGroupMemberKickedBanned, IGroupMemberUnBanned} from 'uikit-resources-lerna'
import 'my-cstom-package-lit'
import  { AvatarStyle, ListItemStyle} from 'my-cstom-package-lit'
import { CometChatThemeService } from "../../CometChatTheme.service";
/**
*
* CometChatBannedMembersComponent is used to render list of banned members
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-banned-members",
  templateUrl: "./cometchat-banned-members.component.html",
  styleUrls: ["./cometchat-banned-members.component.scss"],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class CometChatBannedMembersComponent implements OnInit {
  @Input() bannedMembersRequestBuilder!: CometChat.BannedMembersRequestBuilder;
  @Input() searchRequestBuilder!: CometChat.BannedMembersRequestBuilder;
  @Input() subtitleView!: TemplateRef<any>;
  @Input() listItemView!: TemplateRef<any>;
  @Input() disableUsersPresence:boolean = false;
  @Input() menu!: TemplateRef<any>;
  @Input()   options!: ((member:CometChat.GroupMember)=>CometChatOption[]) | null;
  @Input() backButtonIconURL:string = "assets/backbutton.svg"
  @Input() closeButtonIconURL:string = "assets/close2x.svg"
  @Input() showBackButton:boolean=true;
  @Input() hideSeparator: boolean = false;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() searchPlaceholder: string = "Search Members";
  @Input() searchIconURL: string = "assets/search.svg";
  @Input() hideSearch: boolean = true;
  @Input() title: string = localize("BANNED_MEMBERS");
  @Input() onError:((error:any)=>void) | null = (error:any)=>{
    console.log(error)
  }

  @Input() onSelect!: (member:CometChat.GroupMember)=>void;
  @Input() onBack!:()=>void;
  @Input() onClose!:()=>void;
  @Input() group!:CometChat.Group;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_BANNED_MEMBERS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() titleAlignment: TitleAlignment = TitleAlignment.center;
  @Input() unbanIconURL:string = "assets/close2x.svg"
  menuListStyle = {
    width: "",
    height: "",
    border: "none",
    borderRadius: "8px",
    background: "white",
    textFont: "400 15px Inter",
    textColor: "black",
    iconTint: "rgb(51, 153, 255)",
    iconBackground: "transparent",
    iconBorder: "none",
    iconBorderRadius: "0",
    submenuWidth: "100%",
    submenuHeight: "100%",
    submenuBorder: "1px solid #e8e8e8",
    submenuBorderRadius: "8px",
    submenuBackground: "white",
  }
  unbanIconStyle:any = {
    border:"none",
    background:"transparent",
    buttonIconTint:"rgb(51, 153, 255)"
  }
  selectedMember!:CometChat.GroupMember;
  titleAlignmentEnum:typeof TitleAlignment = TitleAlignment
  selectionmodeEnum: typeof SelectionMode = SelectionMode;
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "32px",
    height: "32px",
  };
  @Input() bannedMembersStyle: BannedMembersStyle = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "",

    padding:"0 100px"
  };
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "transparent",
    borderRadius: "grey",
    titleFont: "",
    titleColor: "",
    border: "",
    hoverBackground:"transparent",
    separatorColor: "rgb(222 222 222 / 46%)"
  };
  searchKeyword: string = "";
  listStyle:ListStyle = new ListStyle({});
  public limit:number = 30;
  public bannedMembersRequest:any;
  public state: States = States.loading;
  public timeout: any;
  public bannedMembers: CometChat.GroupMember[] = [];
  public scopes:string[] = []
  public ccGroupMemberBanned!:Subscription;
  public membersListenerId: string = "bannedMembers_" + new Date().getTime();
  loggedInUser!: CometChat.User | null;
  constructor(private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {  }
  membersList:CometChat.GroupMember[] = [];
  onScrolledToBottom:any = null
  ngOnInit(): void {
    this.onScrolledToBottom = this.fetchNextBannedMembers
    this.setThemeStyle()
 CometChat.getLoggedinUser().then((user: CometChat.User | null)=>{
   this.loggedInUser = user
  this.bannedMembersRequest =  this.getRequestBuilder()
  this.fetchNextBannedMembers()
 }).catch((error:CometChat.CometChatException)=>{
  if(this.onError){
    this.onError(error)
  }
})

  }
  backClicked(){
    if(this.onBack){
      this.onBack()
    }
  }
  closeClicked(){
    if(this.onClose){
      this.onClose()
    }
  }
unBanMember = (member:CometChat.GroupMember)=>{
  CometChat.unbanGroupMember(this.group.getGuid(),  member.getUid()).then(()=>{
    CometChatGroupEvents.ccGroupMemberUnbanned.next({
      unbannedBy:this.loggedInUser!,
      unbannedFrom:this.group,
      unbannedUser:member

    })
    this.updateMember(member)
  }).catch((err:any)=>{
    console.log(err)

  })
}
  /**
   * @param  {CometChat.User} member
   */
   updateMember = (member: CometChat.GroupMember) => {
    let memberlist:CometChat.GroupMember[] = [...this.bannedMembers];
    //search for user
    let userKey = memberlist.findIndex((u: CometChat.GroupMember, k) => u.getUid() == member.getUid());
    //if found in the list, update user object
    if (userKey > -1) {
      memberlist.splice(userKey, 1);
      this.bannedMembers = [...memberlist];
      this.ref.detectChanges();
    }
    else{
      memberlist.push(member)
      this.bannedMembers = [...memberlist];
      this.ref.detectChanges();
    }
  };
  attachListeners() {
        //Attaching User Listeners to dynamilcally update when a user comes online and goes offline
        CometChat.addGroupListener(
          this.membersListenerId,
          new CometChat.GroupListener({
            onGroupMemberBanned: (message: CometChat.Action, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group) => {
              this.updateMember(bannedUser as CometChat.GroupMember)
            },
            onGroupMemberUnbanned: (
              message: CometChat.Action,
              unbannedUser: CometChat.User,
              unbannedBy: CometChat.User,
              unbannedFrom: CometChat.Group
            ) => {
              this.updateMember(unbannedUser as CometChat.GroupMember)
            },
          })
        );
  }
  removeListener() {
    CometChat.removeUserListener(this.membersListenerId);
    this.membersListenerId = "";
  }
  fetchNextBannedMembers = () => {
    this.onScrolledToBottom = null
    if(this.bannedMembersRequest && this.bannedMembersRequest.pagination && (this.bannedMembersRequest.pagination.current_page == 0 || this.bannedMembersRequest.pagination.current_page !=  this.bannedMembersRequest.pagination.total_pages)){
      this.onScrolledToBottom = this.fetchNextBannedMembers
      this.state = States.loading
      this.ref.detectChanges();
      try {
        this.bannedMembersRequest.fetchNext().then(
          (bannedMembers: CometChat.GroupMember[]) => {
            this.state = States.loading
            if ((bannedMembers.length <= 0 && this.bannedMembers?.length <= 0) || (bannedMembers.length === 0 && this.bannedMembers?.length <= 0)) {
              this.state = States.empty
              this.ref.detectChanges();
            } else {
              this.state = States.loaded
              this.bannedMembers = [...this.bannedMembers, ...bannedMembers];
              this.ref.detectChanges();
            }
          },
          (error: any) => {
            console.log(error)
            this.state = States.error
            this.ref.detectChanges();
          }
        );
      } catch (error: any) {
        console.log(error)
        this.state = States.error
        this.ref.detectChanges();
      }
    }
    else{
      this.state = States.loaded
    }

  }
  getRequestBuilder() {
    if(this.searchRequestBuilder){
      return this.searchRequestBuilder.build()
    }
    else if (this.bannedMembersRequestBuilder) {
      return this.bannedMembersRequestBuilder.build();
    }
    else {
      return new CometChat.BannedMembersRequestBuilder(this.group?.getGuid())
        .setLimit(this.limit)
        .setSearchKeyword(this.searchKeyword)
        .build();
    }
  }
  subscribeToEvents() {
    this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item:IGroupMemberKickedBanned) => {
      if(item?.kickedFrom?.getGuid() == this.group.getGuid()){
        this.updateMember(item?.kickedUser as CometChat.GroupMember)
      }
    })
  }
  // unsubscribe to subscribed events.
  unsubscribeToEvents() {
    this.ccGroupMemberBanned.unsubscribe();
  }
  /**
   * @param  {string} key
   */
   onSearch = (key: string) => {
    try {
      this.searchKeyword = key;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        const request = this.searchRequestBuilder ? this.searchRequestBuilder.setSearchKeyword(this.searchKeyword).build() : this.getRequestBuilder();
        this.bannedMembersRequest = request;
        this.bannedMembers = [];
        this.fetchNextBannedMembers();
      }, 500);
    } catch (error:any) {
      if(this.onError){
        this.onError(error)
      }

    }
  };

  setThemeStyle() {
    this.setBanMembersStyle()
    this.setListItemStyle()
    this.setAvatarStyle()
    this.menuListStyle.background = this.themeService.theme.palette.getBackground() as string;
    this.menuListStyle.iconBackground = this.themeService.theme.palette.getBackground()  as string;
    this.menuListStyle.iconTint = this.themeService.theme.palette.getAccent400()  as string;
    this.menuListStyle.submenuBackground = this.themeService.theme.palette.getBackground()  as string;
    this.menuListStyle.textFont = fontHelper(this.themeService.theme.typography.caption1);
    this.menuListStyle.textColor = this.themeService.theme.palette.getAccent500()  as string;
    this.unbanIconStyle.buttonIconTint =  this.bannedMembersStyle.unbanIconTint;

  }
  setBanMembersStyle(){
    let defaultStyle:BannedMembersStyle = new BannedMembersStyle({
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
      unbanIconTint:this.themeService.theme.palette.getPrimary()
    })
    this.bannedMembersStyle = {...defaultStyle,...this.bannedMembersStyle}
    this.listStyle ={
      titleTextFont : this.bannedMembersStyle.titleTextFont,
      titleTextColor : this.bannedMembersStyle.titleTextColor,
      emptyStateTextFont : this.bannedMembersStyle.emptyStateTextFont,
      emptyStateTextColor : this.bannedMembersStyle.emptyStateTextColor,
      errorStateTextFont : this.bannedMembersStyle.errorStateTextFont,
      errorStateTextColor : this.bannedMembersStyle.errorStateTextColor,
      loadingIconTint : this.bannedMembersStyle.loadingIconTint,
      separatorColor : this.bannedMembersStyle.separatorColor,
      searchIconTint : this.bannedMembersStyle.searchIconTint,
      searchBorder : this.bannedMembersStyle.searchBorder,
      searchBorderRadius : this.bannedMembersStyle.searchBorderRadius,
      searchBackground : this.bannedMembersStyle.searchBackground,
      searchPlaceholderTextFont : this.bannedMembersStyle.searchPlaceholderTextFont,
      searchPlaceholderTextColor : this.bannedMembersStyle.searchPlaceholderTextColor,
      searchTextFont : this.bannedMembersStyle.searchTextFont,
      searchTextColor : this.bannedMembersStyle.searchTextColor,
    }
  }
  setListItemStyle(){
    let defaultStyle:ListItemStyle = new ListItemStyle({
      height: "45px",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: "",
      borderRadius: "0",
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      titleColor: this.themeService.theme.palette.getAccent(),
      border: "none",
      separatorColor:this.themeService.theme.palette.getAccent200(),
      hoverBackground:""
    })
    this.listItemStyle = {...defaultStyle,...this.listItemStyle}
  }
  setAvatarStyle(){
    let defaultStyle:AvatarStyle = new AvatarStyle({
      borderRadius: "24px",
      width: "36px",
      height: "36px",
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

   membersStyles = ()=>{
    return {
      padding:this.bannedMembersStyle.padding
    }
  }
  // styles
  backButtonStyle = ()=> {
    return {
     height:"24px",
     width:"24px",
     border:"none",
     borderRadius:"0",
     background:"transparent",
      buttonIconTint:this.bannedMembersStyle.backButtonIconTint || this.themeService.theme.palette.getPrimary()
    }
  }
  closeButtonStyle = ()=> {
    return {
      height:"24px",
      width:"24px",
      border:"none",
      borderRadius:"0",
      background:"transparent",
      buttonIconTint:this.bannedMembersStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
    }
  }
  wrapperStyle = ()=>{
    return {
      height: this.bannedMembersStyle.height,
      width: this.bannedMembersStyle.width,
      background: this.bannedMembersStyle.background,
      border: this.bannedMembersStyle.border,
      borderRadius: this.bannedMembersStyle.borderRadius
    }
  }
}
