import { Component, Input, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatTheme, fontHelper, inputData } from '@cometchat-pro/angular-ui-kit';
import { dataItemStyle } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Messages/CometChatMessageHeader/headerInterface';
import { InputData } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Shared/InputData/inputData';
@Component({
  selector: 'cometchat-data-item-demo',
  templateUrl: './cometchat-data-item-demo.component.html',
  styleUrls: ['./cometchat-data-item-demo.component.scss']
})
export class CometChatDataItemDemoComponent implements OnInit {
  public closeIconURL:string="assets/Plus-1.png";
  @Input() theme:CometChatTheme = new CometChatTheme({});
  @Input() closeButton:any;
  public dataItemStyle:dataItemStyle = {
    background:"",
    titleColor:"",
    titleFont:"",
    subtitleColor:"",
    subtitleFont:""
  };
public image:string="https://data-us.cometchat.io/assets/images/avatars/captainamerica.png";
  constructor() { 
  }
  public user:any = {
    getName:()=> "Raj Dubey",
    getAvatar:()=> this.image,
    getUid:()=>"uid123",
    getStatus:()=>"online"
  };
  public group: any={
    getName:()=> "new group",
    getMembersCount:()=> 12,
    getGuid:()=> "new__group123",
    getType:()=>"public",
    getIcon:()=>null
  };
  public inputdata:InputData = {
    thumbnail:true,
    title:true
  }
  public groupInputdata:InputData = {
    thumbnail:true,
    title:true,
  }
  ngOnInit(): void {
    this.groupInputdata.subtitle = ()=> this.group.getMembersCount() + " members";
    this.dataItemStyle.background = "transparent";
    this.dataItemStyle.titleColor = this.theme.palette.getAccent();
    this.dataItemStyle.subtitleColor = this.theme.palette.getAccent600();
    this.dataItemStyle.titleFont = fontHelper(this.theme.typography.title2);
    this.dataItemStyle.subtitleFont = fontHelper(this.theme.typography.subtitle2);
  }
  // style
  style:any = {
    closeIconStyle:()=>{
      return{
        WebkitMask: `url(${this.closeIconURL}) center center no-repeat`,
        background:  this.theme.palette.getAccent600(),
        transform:"rotate(45deg)"
      }
    },
    titleStyle:()=>{
      return{
       font: fontHelper(this.theme.typography.title2),
       color:this.theme.palette.getAccent(),
      }
    },
    wrapperStyle:()=>{
      return{
        background:  this.theme.palette.getBackground(),
        boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },
    cardDescriptionStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600()
      }
    },
    sectionHeaderStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.caption1),
        color:this.theme.palette.getAccent600()
      }
    }
  }
}
