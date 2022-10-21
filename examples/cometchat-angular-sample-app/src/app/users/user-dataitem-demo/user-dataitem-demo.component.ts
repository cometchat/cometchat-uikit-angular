import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { dataItemStyle } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Messages/CometChatMessageHeader/headerInterface';
import { InputData } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Shared/InputData/inputData';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-user-dataitem-demo',
  templateUrl: './user-dataitem-demo.component.html',
  styleUrls: ['./user-dataitem-demo.component.scss']
})
export class UserDataitemDemoComponent implements OnInit {
  @Input() theme:CometChatTheme = new CometChatTheme({});
  public dataItemStyle:dataItemStyle = {
    background:"",
    titleColor:"",
    titleFont:"",
    subtitleColor:"",
    subtitleFont:""
  };
public image:string="https://data-us.cometchat.io/assets/images/avatars/captainamerica.png";
constructor(private cometchatService:CometChatServices) { 
  if(this.cometchatService.theme){
    this.theme = this.cometchatService.theme

  }

}
  public user:any = {
    getName:()=> "Raj Dubey",
    getAvatar:()=> this.image,
    getUid:()=>"uid123",
    getStatus:()=>"online"
  };

  public inputdata:InputData = {
    thumbnail:true,
    title:true
  }

  ngOnInit(): void {
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
    },}


}
