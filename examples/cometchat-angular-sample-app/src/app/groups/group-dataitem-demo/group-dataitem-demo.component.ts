import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { dataItemStyle } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Messages/CometChatMessageHeader/headerInterface';
import { InputData } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Shared/InputData/inputData';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-group-dataitem-demo',
  templateUrl: './group-dataitem-demo.component.html',
  styleUrls: ['./group-dataitem-demo.component.scss']
})
export class GroupDataitemDemoComponent implements OnInit {
  @Input() theme:CometChatTheme = new CometChatTheme({});
  public dataItemStyle:dataItemStyle = {
    background:"",
    titleColor:"",
    titleFont:"",
    subtitleColor:"",
    subtitleFont:""
  };

constructor(private cometchatService:CometChatServices) { 
  if(this.cometchatService.theme){
    this.theme = this.cometchatService.theme

  }

}
  public group: any={
    getName:()=> "new group",
    getMembersCount:()=> 12,
    getGuid:()=> "new__group123",
    getType:()=>"public",
    getIcon:()=>null
  };

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

    wrapperStyle:()=>{
      return{
        background:  this.theme.palette.getBackground(),
        boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 3px`
      }
    },

  }

}
