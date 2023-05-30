import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import {  Subscription } from "rxjs";
import 'my-cstom-package-lit'
import {AvatarStyle, DateStyle,ListItemStyle, } from  'my-cstom-package-lit'
import {    DetailsStyle, BaseStyle, CallButtonsStyle, DatePatterns, CallButtonsConfiguration, } from "uikit-utils-lerna";
import { fontHelper, localize, CometChatGroupEvents, CometChatUIKitConstants, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberJoined, IOwnershipChanged, CometChatDetailsOption, CometChatDetailsTemplate} from 'uikit-resources-lerna'
import { CometChat } from "@cometchat-pro/chat";
import { CometChatThemeService } from "../../../CometChatTheme.service";
/**
*
* CometChatCallDetailsComponent renders details of user or group.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-call-details",
  templateUrl: "./cometchat-call-details.component.html",
  styleUrls: ["./cometchat-call-details.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatCallDetailsComponent implements OnInit, OnChanges  {
  @Input() group!: CometChat.Group;
  @Input() user!: CometChat.User;
  @Input() title: string = localize("CALL_DETAILS");
  @Input() closeButtonIconURL: string = "assets/close2x.svg";
  @Input() hideProfile:boolean = false;
  @Input() subtitleView!: TemplateRef<any>;
  @Input() customProfileView!: TemplateRef<any>;
  @Input() disableUsersPresence: boolean = false;
  @Input() privateGroupIcon:string ="assets/Private.svg";
  @Input() protectedGroupIcon:string = "assets/Locked.svg";
  @Input() onError:((error: any) => void) | null = (error:any)=>{
    console.log(error)
  }
  @Input() data:CometChatDetailsTemplate[] = []
  @Input() onClose!:()=>void;
  @Input() statusIndicatorStyle: any = {
    height: "10px",
    width: "10px",
    borderRadius: "16px",
    border:""
  };
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "28px",
    height: "28px",
    border: "none",
  };
  @Input() callDetailsStyle: DetailsStyle = {
    width: "100%",
    height: "100%",
    padding:"0 100px"
  };
  @Input() callButtonsConfiguration:CallButtonsConfiguration = new CallButtonsConfiguration({})
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "transparent",
    borderRadius: "grey",
    titleFont: "600 15px Inter",
    titleColor: "black",
    border: "",
    hoverBackground: "transparent",
    separatorColor: "rgb(222 222 222 / 46%)"
  };
public messagesList:CometChat.Call[] = []
  public loggedInUser:CometChat.User | null = null;
  ccGroupMemberAdded!:Subscription;
  ccGroupMemberJoined!:Subscription;
  ccGroupMemberKicked!:Subscription;
  ccGroupMemberBanned!:Subscription;
  ccOwnershipChanged!:Subscription;
  public statusColor: any = {
    private: "",
    password: "#F7A500",
    public: ""
  }
  closeButtonStyle:any ={
    height:"24px",
    width:"24px",
    border:"none",
    borderRadius:"0",
    background:"transparent",
    buttonIconTint:this.callDetailsStyle.closeButtonIconTint || this.themeService.theme.palette.getPrimary()
  }
  buttonStyle:any ={
    height:"100%",
    width:"100%",
    border:"none",
    borderRadius:"0",
    background:"transparent",
    buttonTextColor: this.themeService.theme.palette.getPrimary() || "rgba(51, 153, 255)",
    buttonTextFont: "500 16px Inter"
  }
  dividerStyle:any = {
    background:"rgb(222 222 222 / 46%)",
    height:"1px",
    width:"100%"
  }
//
  getTitleStyle (){
    return {
      textFont: this.callDetailsStyle.titleTextFont || fontHelper(this.themeService.theme.typography.title1),
      textColor: this.callDetailsStyle.titleTextColor || this.themeService.theme.palette.getAccent()
    }
  }
  public subtitleText:string = "";
  public userListenerId = "userlist_" + new Date().getTime();
  public requestBuilder: any;
  public limit:number = 5;
  types: string[] = [];
  categories: string[] = [];
  constructor(private ref:ChangeDetectorRef,private themeService:CometChatThemeService){}
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["user"] || changes["group"]){

      this.updateSubtitle()
    }
  }
  removeListener(){
    CometChat.removeUserListener(this.userListenerId)
  }
  ngOnDestroy(){
    this.removeListener();
   if(this.onClose){
    this.onClose()
   }
 this.unsubscribeToEvents()
  }
  ngOnInit(): void {
    this.setThemeStyle()
    this.subscribeToEvents()
    this.statusColor.online = this.callDetailsStyle.onlineStatusColor || this.themeService.theme.palette.getSuccess()
    this.attachListeners()
    this.updateSubtitle()
  }

  /**
   * Compares two dates and sets Date on a a new day
   */
  /**
   * @param  {number} firstDate
   * @param  {number} secondDate
   */
  isDateDifferent(firstDate: number | undefined, secondDate: number | undefined) {
    let firstDateObj: Date, secondDateObj: Date;
    firstDateObj = new Date(firstDate! * 1000);
    secondDateObj = new Date(secondDate! * 1000);
    return firstDateObj.getDate() !== secondDateObj.getDate() ||
      firstDateObj.getMonth() !== secondDateObj.getMonth() ||
      firstDateObj.getFullYear() !== secondDateObj.getFullYear();
  }
  subscribeToEvents(){
    this.ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item:IGroupMemberAdded)=>{ this.group = item?.userAddedIn!;
      this.group = item?.userAddedIn!
      this.updateSubtitle()
      this.ref.detectChanges()
    })
    this.ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((item:IGroupMemberJoined)=>{
      this.group = item?.joinedGroup;
      this.updateSubtitle()
      this.ref.detectChanges()
    });
    this.ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item:IGroupMemberKickedBanned)=>{
      this.group = item?.kickedFrom!;
      this.updateSubtitle()
      this.ref.detectChanges()
    });
    this.ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item:IGroupMemberKickedBanned)=>{
      this.group = item?.kickedFrom!;
      this.updateSubtitle()
      this.ref.detectChanges()
    });
    this.ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe((item:IOwnershipChanged)=>{
      this.group = item?.group!;
      this.updateSubtitle();
      this.ref.detectChanges();
    });
  }
  unsubscribeToEvents(){
    this.ccGroupMemberAdded?.unsubscribe();
    this.ccGroupMemberJoined?.unsubscribe();
    this.ccGroupMemberKicked?.unsubscribe();
    this.ccGroupMemberBanned?.unsubscribe();
    this.ccOwnershipChanged?.unsubscribe();
  }
  checkStatusType = ()=> {
    return   this.user && !this.disableUsersPresence ? this.statusColor[this.user?.getStatus()] : this.statusColor[this.group?.getType()]
  }
  updateSubtitle() {
    const count = this.group?.getMembersCount();
    const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
    this.subtitleText = this.user ? this.user.getStatus() : `${count} ${membersText}`;
    this.ref.detectChanges();
  }
  getButtonStyle(option:CometChatDetailsOption){
    return {
      height:"100%",
      width:"100%",
      border:"none",
      borderRadius:"0",
      buttonTextFont:option?.titleFont,
      buttonTextColor:option?.titleColor,
      background:option?.backgroundColor || "transparent"
    }
  }
  checkGroupType(): string {
    let image: string = "";
    if (this.group) {
      switch (this.group?.getType()) {
        case CometChatUIKitConstants.GroupTypes.password:
          image = this.protectedGroupIcon;
          break;
        case CometChatUIKitConstants.GroupTypes.private:
          image = this.privateGroupIcon;
          break;
        default:
          image = ""
          break;
      }
    }
    return image
  }
  updateUserStatus(user:CometChat.User){
    if (this.user && this.user.getUid() && this.user.getUid() === user.getUid()) {
      this.user.setStatus(user.getStatus());
      this.updateSubtitle()
    }
    // this.ref.detectChanges();
  }
  attachListeners() {
    try {
      if(!this.disableUsersPresence){
        CometChat.addUserListener(
          this.userListenerId,
          new CometChat.UserListener({
            onUserOnline: (onlineUser: CometChat.User) => {
              /* when someuser/friend comes online, user will be received here */
              this.updateUserStatus(onlineUser);
            },
            onUserOffline: (offlineUser: CometChat.User) => {
              /* when someuser/friend went offline, user will be received here */
              this.updateUserStatus( offlineUser);
            },
          })
        );
      }
    } catch (error:any) {
console.log(error)
    }
  }

  getSectionHeaderStyle(){
    return  {
      textFont:"500 15px Inter",
      textColor:"lightgrey"
    }
  }
  getCallStatusStyleStyle(){
    return {
      textFont:"400 15px Inter",
      textColor:"black"
    }
  }
  getDateStyle(){
    return  {
      textFont:"400 15px Inter",
      textColor:"lightgrey"
    }
  }
  onCloseClick =()=>{
    if(this.onClose){
      this.onClose()
    }
  }
   onCloseDetails(){
     if(this.onClose){
       this.onClose()
     }
   }
  subtitleStyle = ()=>{
 if(this.user && this.user.getStatus() == CometChatUIKitConstants.userStatusType.online){
  return{
    textFont:this.callDetailsStyle.subtitleTextFont,
    textColor:this.themeService.theme.palette.getPrimary()
  }
 }
 else{
  return{
    textFont:this.callDetailsStyle.subtitleTextFont,
    textColor:this.callDetailsStyle.subtitleTextColor
  }
 }
  }
    /**
   * @param  {CometChat.Group} group
   */
     getGroupIcon = (group: CometChat.Group) => {
      let status;
      if (group) {
        switch (group.getType()) {
          case CometChatUIKitConstants.GroupTypes.password:
            status = this.protectedGroupIcon;
            break;
          case CometChatUIKitConstants.GroupTypes.private:
            status = this.privateGroupIcon;
            break;
          default:
            status = null
            break;
        }
      }
      return status
    }
      /**
   * @param  {CometChat.Group} group
   */
   getStatusIndicatorColor(group: CometChat.Group) {
    return this.statusColor[(group?.getType() as string)];
  }
  getTemplateOptions = (template:CometChatDetailsTemplate)=>{
    if(template.options){
      return template.options(this.user,this.group,template.id as string)
    }
    else return []
  }
  getCustomOptionView(option:CometChatDetailsOption){
    return option?.customView
    }
    showDataSectionStyle(template:CometChatDetailsTemplate){
      return  {
        textFont:template.titleFont,
        textColor:template.titleColor
      }
    }
  setThemeStyle() {
    this.setDetailsStyle()
    this.setAvatarStyle()
    this.setStatusStyle()
    this.setListItemStyle();
    this.statusColor.private =  this.callDetailsStyle.privateGroupIconBackground ;
    this.statusColor.online = this.callDetailsStyle.onlineStatusColor ;
    this.statusColor.password = this.callDetailsStyle.passwordGroupIconBackground
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
      hoverBackground: "transparent"
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
  setStatusStyle(){
    let defaultStyle:BaseStyle = {
        height: "12px",
        width:"12px",
        border:"none",
        borderRadius:"24px",
    }
    this.statusIndicatorStyle = {...defaultStyle,...this.statusIndicatorStyle}
  }
  setDetailsStyle(){
    let defaultStyle:DetailsStyle = new DetailsStyle({
      background:this.themeService.theme.palette.getBackground(),
      border:`1px solid ${this.themeService.theme.palette.getAccent50()}`,
      titleTextFont:fontHelper(this.themeService.theme.typography.title1),
      titleTextColor:this.themeService.theme.palette.getAccent(),
      onlineStatusColor:this.themeService.theme.palette.getSuccess(),
      privateGroupIconBackground:this.themeService.theme.palette.getSuccess(),
      passwordGroupIconBackground:"RGB(247, 165, 0)",
      closeButtonIconTint:this.themeService.theme.palette.getPrimary(),
      width: "100%",
      height: "100%",
      borderRadius: "",
      subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      subtitleTextColor:this.themeService.theme.palette.getAccent600(),
      padding:"0 100px"
    })
    this.callDetailsStyle = {...defaultStyle,...this.callDetailsStyle}
  }
  wrapperStyle = () => {
    return {
      width: this.callDetailsStyle.width,
      height: this.callDetailsStyle.height,
      border: this.callDetailsStyle.border,
      borderRadius:this.callDetailsStyle.borderRadius,
      background: this.callDetailsStyle.background,
    }
  }
  marginStyle = () => {
    return {
      padding:this.callDetailsStyle?.padding
    }
  }
}
