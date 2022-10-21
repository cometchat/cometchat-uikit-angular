import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CometChatServices } from '../../../app/app.service';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { dataItemStyle } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Messages/CometChatMessageHeader/headerInterface';
import { InputData } from '@cometchat-pro/angular-ui-kit/lib/src/cometchat-pro-angular-ui-kit/src/components/Shared/InputData/inputData';

@Component({
  selector: 'cometchat-groups-demo',
  templateUrl: './groups-demo.component.html',
  styleUrls: ['./groups-demo.component.scss']
})
export class GroupsDemoComponent implements OnInit {

  @Input() theme = new CometChatTheme({})
  public openGroupsWithMessages:boolean = false;
  public openGroups:boolean = false;
  public openGroupList:boolean = false;
  public openGroupDataItem:boolean = false;

  groupListStyle:any = {
    width: "100%",
    height: "100%",
    background: "white",
    border: "none",
    borderRadius: "",
    backIconTint: "grey",
    createGroupIconTint: "rgb(51, 153, 255)"
    
  }
  public createGroupIconURL:string="assets/resources/create-button.svg"
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

  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme

    }

  }
  

  ngOnInit(): void {
    this.groupInputdata.subtitle = ()=> this.group.getMembersCount() + " members";

    this.setTheme()
    this.onResize()
  }
  innerWidth!: number;
  isMobileView: boolean=false;
    /**
   * Checks when window size is changed in realtime
   */
     @HostListener("window:resize", [])
     onResize(): boolean {
       try {
         this.innerWidth = window.innerWidth;
         if (
           this.innerWidth >= 320 &&
           this.innerWidth <= 760
         ) {
           this.isMobileView = true;
         } else {
           this.isMobileView = false
         }
       } catch (error) {
       
       }
       return true;
     }
  setTheme(){


    this.groupListStyle.background =   this.theme.palette.getBackground(); 
    this.groupListStyle.errorStateTextFont = fontHelper(this.theme.typography.heading)
    this.groupListStyle.errorStateTextColor = this.theme.palette.getAccent400()
    this.groupListStyle.emptyStateTextFont =  fontHelper(this.theme.typography.heading)
    this.groupListStyle.emptyStateTextColor = this.theme.palette.getAccent400()
  }

}
