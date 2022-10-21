import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from "@angular/core";
import { AvatarConfiguration } from "../../../PrimaryComponents/CometChatConfiguration/AvatarConfiguration";
import { StatusIndicatorConfiguration } from "../../../PrimaryComponents/CometChatConfiguration/StatusIndicatorConfiguration";
import { avatarStyles, statusIndicatorStyles } from '../DataItemInterface'
import { GroupType } from "../../../Constants/UIKitConstants";
import { groupTypes } from '../../../Types/interface'
import { CometChatTheme } from "../../../PrimaryComponents";
import { CometChat } from "@cometchat-pro/chat";
import { styles } from '../DataItemInterface'
import { fontHelper } from "../../../PrimaryComponents/CometChatTheme/Typography";
import { CometChatUsersEvents } from "../../../../Users/CometChatUsersEvents.service";
import { CometChatGroupEvents } from "../../../../Groups/CometChatGroupEvents.service";
import { InputData } from "../../../InputData/inputData";
@Component({
  selector: "cometchat-data-item",
  templateUrl: "./cometchat-data-item.component.html",
  styleUrls: ["./cometchat-data-item.component.scss"],
})
export class CometChatDataItemComponent implements OnInit, OnChanges {
  // we will receive this properties from parent component
  @Input() inputData: InputData | null = {}
  @Input() avatarConfiguration: AvatarConfiguration = new AvatarConfiguration({});
  @Input() statusIndicatorConfiguration: StatusIndicatorConfiguration = new StatusIndicatorConfiguration({});
  @Input() style: styles = {
    height:"100%",
    width:"100%",
    background:"white",
    activeBackground: "",
    borderRadius:"0",
    titleFont:" 600 15px Inter, sans-serif",
    titleColor:"rgb(255, 255, 255)",
    subtitleFont:"400 13px Inter, sans-serif",
    subtitleColor:"rgba(255, 255, 255, 0.58)",
  };
  @Input() isActive!: boolean;
  @Input() options = {};
  @Input() user: CometChat.User | null = null;
  @Input() group: CometChat.Group | null = null;
  @Input() groupMember:CometChat.GroupMember | null = null;
  isHovering:boolean = false
  public statusIndicatorStyle: statusIndicatorStyles = {
    height:"",
    width:"",
    border:"",
    borderRadius:"",
    background:"",
    style:{}
  };
  public avatarStyle: avatarStyles = {
    backgroundColor:"",
	nameTextFont:"",
	nameTextColor:"",
	outerView:"",
  outerViewSpacing:"",
  height:"",
  width:"",
  borderRadius:"",
  border:""
  };
   @Input() theme: CometChatTheme = new CometChatTheme({});
  public statusImage: string | null = ""
  public name!: string;
  // background color for group type icon and status indicator
  public statusColor: object = {
    online: "",
    private: "",
    password: "#F7A500",
    public: ""
  }
  statusStyle:object = {
    marginLeft: "-10px",
    marginTop: "25px"
  }
  //  iconc for group type eg - password group and private group
  groupTypeIcons: groupTypes = {
    public: "",
    private: "assets/resources/Private.svg",
    password: "assets/resources/Locked.svg",
  }
  // 
  constructor(private ref: ChangeDetectorRef, private userEvents:CometChatUsersEvents, private groupEvents:CometChatGroupEvents) {
  }
  ngOnChanges(change: SimpleChanges) {
    if (change["user"] && change["user"].currentValue) {
      this.user = change["user"].currentValue;
    }
    else if (change["group"] && change["group"].currentValue) {
      this.group = change["group"].currentValue;
    }
    else if (change["groupMember"] && change["groupMember"].currentValue) {
      this.groupMember = change["groupMember"].currentValue;
    }
  }
  clickHandler(user: object) {
    // handling on click event
  }
  ngOnInit() {
    
  
    this.setName()
    this.checkConfiguration();
    this.setThemeStyle();
  
  }
  
  setName(){
    
    if(this.inputData?.title){
      (this.name  as any)= this.user?.getName() || this.group?.getName() || this.groupMember?.getName()
    }
  }
  getConversationId = ()=>{
    let id:string | undefined= ""
    if(this.inputData!.id){
      id = this.user?.getUid() || this.group?.getGuid() || this.groupMember?.getUid()

    }
    else{
      id = undefined
    }
    return id

  }
  getAvatar() {
    // setting name.
    let image:string = "";
    if (this.user) {
      this.name = this.user?.getName();
      image = this.user?.getAvatar();
    }
    else if (this.group) {
      this.name = this.group?.getName();
      image = this.group?.getIcon();
    }
    else {
      this.name = (this.groupMember?.getName() as string);
      image = (this.groupMember?.getAvatar() as string);
    } 
    // passing avatar to cometchat avatar component.
    return  image
  }
  /**
 * @param  {CometChat.Conversation} conversation
 */
  checkStatusType() {
    let color;
    if (this.user || this.groupMember) {
      this.user ? color = (this.statusColor as any)[this.user.getStatus()] : color = (this.statusColor as any)[(this.groupMember?.getStatus() as string)];  
    }
    else {
      color = (this.statusColor as any)[(this.group?.getType() as string)];
    }
    return color;
  }
  checkGroupType(): any {
    let status;
    if (this.group) {
      switch (this.group.getType()) {
        case GroupType.password:
          status = this.groupTypeIcons.password;
          break;
        case GroupType.private:
          status = this.groupTypeIcons.private;
          break;
        default:
          status = null
          break;
      }
    }
    return status
  }
  setThemeStyle() {
    this.avatarStyle.backgroundColor = this.theme.palette.getAccent700();
    this.avatarStyle.nameTextFont = fontHelper(this.theme.typography.name) ;
    this.avatarStyle.nameTextColor = this.theme.palette.getAccent900() ;
    (this.statusColor as any).private =this.theme.palette.getSuccess() ;
    (this.statusColor as any).online =this.theme.palette.getSuccess();
  }
  hideShowBackground(event:any){
    if(event.type == "mouseenter" && !this.isActive){
      this.isHovering = true
    }
    else if(event.type == "mouseleave"){
      this.isHovering = false
    }
  }
  // avatar config method
  checkConfiguration() {
    if (this.avatarConfiguration) {
      let defaultConfig = new AvatarConfiguration({})
      this.setAvatarConfig(this.avatarConfiguration, defaultConfig)
    }
    else {
      let defaultConfig = new AvatarConfiguration({});
      this.setAvatarConfig(defaultConfig)
    }
    if (this.statusIndicatorConfiguration) {
      let defaultConfig = new StatusIndicatorConfiguration({});
      this.setStatusIndicatorConfig(this.statusIndicatorConfiguration, defaultConfig)
    }
    else {
      let defaultConfig = new StatusIndicatorConfiguration({})
      this.setStatusIndicatorConfig(defaultConfig)
    }
  }
  setAvatarConfig(config: AvatarConfiguration, defaultConfig?: AvatarConfiguration) {
    this.avatarStyle.height = config.height || defaultConfig?.height;
    this.avatarStyle.width = config.width || defaultConfig?.width;
    this.avatarStyle.border = config.border || defaultConfig?.border;
    this.avatarStyle.borderRadius = config.borderRadius || defaultConfig?.borderRadius;
    this.avatarStyle.outerView = config.outerView || defaultConfig?.outerView;
    this.avatarStyle.outerViewSpacing = config.outerViewSpacing || defaultConfig?.outerViewSpacing;
  }
  setStatusIndicatorConfig(config: StatusIndicatorConfiguration, defaultConfig?: StatusIndicatorConfiguration) {
    this.statusIndicatorStyle.width = config.width || defaultConfig?.width;
    this.statusIndicatorStyle.height = config.height || defaultConfig?.height;
    this.statusIndicatorStyle.border = config.border || defaultConfig?.border;
    this.statusIndicatorStyle.borderRadius = config.borderRadius || defaultConfig?.borderRadius;

  }

  // this object contains dynamic stylings for this component
  dataItemStyles = {
    itemThumbnailStyle: () => {
      return {
        display: "flex",
        justifyContent: "flex-start",
        flexShrink: "0",
        position: "relative",
      };
    },
    itemDetailStyle: () => {
      return {
        width: "calc(100% - 70px)",
        flexGrow: "1",
        paddingLeft: "8px",
      };
    },
    itemNameStyle: () => {
      return {
        lineHeight: "22px",
        font: this.style?.titleFont || fontHelper(this.theme.typography.title2),
        color: this.style?.titleColor || this.theme.palette.getAccent(),
      };
    },
    itemDescStyle: () => {
      return {
        color: this.style.subtitleColor || this.theme.palette.getAccent600(),
        font: this.style.subtitleFont || fontHelper(this.theme.typography.subtitle2)
      };
    },
    listItem: () => {
      return {
        width: this.style?.width,
        height: this.style?.height,
        borderBottom: this.style.border,
        background: this.isActive || this.isHovering ?  this.style.activeBackground || this.theme.palette.getAccent50(): this.style?.background || this.theme.palette.getBackground(),
      };
    },
  }
  // we can handle on mouse hover  here.
  toggleTooltip(event: any) {
  }
}
