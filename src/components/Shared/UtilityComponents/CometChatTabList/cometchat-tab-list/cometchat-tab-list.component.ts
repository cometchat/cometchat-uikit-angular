import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'cometchat-tab-list',
  templateUrl: './cometchat-tab-list.component.html',
  styleUrls: ['./cometchat-tab-list.component.scss']
})
export class CometChatTabListComponent implements OnInit {
  @Input() tabs:any = [
    {
      id: "chats",
      title: "Chats",
      iconURL: "assets/resources/deleteicon.svg",
      callBack: null,
    },
    {
      id: "users",
      title: "Users",
      iconURL: "assets/resources/deleteicon.svg",
      callBack: null,
    },
    {
      id: "groups",
      title: "Groups",
      iconURL: "assets/resources/deleteicon.svg",
      callBack: null,
    }
  ];
  @Input() panes:any = [];
  @Input() tabSeperator:any = null;
  @Input() style: any = {
    separatorColor: "",
    iconTint: "",
    titleFont: "",
    titleColor: "",
    titleAppearance: "",
    activeIconTint: "",
    activeTitleFont: "",
    activeTitleColor: "",
    activeTitleAppearance: "",
    activeBackground: "",
  };
  listItemStyle = {
    display:"flex",
    flexDirection:"column",
    width:"100%",
    height:"100%",
    background:"transparent",
    border:"",
    borderRadius:"",
    textFont:"500 11px Inter",
    textColor:"rgb(51, 153, 255)",
    iconTint:"rgb(51, 153, 255)",
    iconBackground:"",
    iconBorder:"",
    iconBorderRadius:"",
    marginLeft:"0"

  }
  @Input() activeTab:any;
  @Input() layout: any;
@Input() animation: any;
@Input() placeholder: any; //placeholder or loading for pane view until content loads 
  ngOnInit(){

  }
  onClick =(tab:any) =>{
    if(tab.callBack){
      tab.callBack(tab)
    }

  }

}
