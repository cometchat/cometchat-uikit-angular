import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { CometChatServices } from '../../../app/app.service';

@Component({
  selector: 'cometchat-group-list-demo',
  templateUrl: './group-list-demo.component.html',
  styleUrls: ['./group-list-demo.component.scss']
})
export class GroupListDemoComponent implements OnInit {
  @Input() theme = new CometChatTheme({})
  groupListStyle:any = {
    
  }
  constructor(private cometchatService:CometChatServices) { 
    if(this.cometchatService.theme){
      this.theme = this.cometchatService.theme

    }

  }

  ngOnInit(): void {


    this.setTheme()
  
  }

  setTheme(){

    this.groupListStyle.background =   this.theme.palette.getBackground(); 
    this.groupListStyle.errorStateTextFont = fontHelper(this.theme.typography.heading)
    this.groupListStyle.errorStateTextColor = this.theme.palette.getAccent400()
    this.groupListStyle.emptyStateTextFont =  fontHelper(this.theme.typography.heading)
    this.groupListStyle.emptyStateTextColor = this.theme.palette.getAccent400()
  }

}
