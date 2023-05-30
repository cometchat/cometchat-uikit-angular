import { Component, HostListener, OnInit } from '@angular/core';
import { GroupsStyle } from 'uikit-utils-lerna';
import {CometChatThemeService, fontHelper } from '@cometchat-pro/angular-ui-kit';
import { ListItemStyle } from 'my-cstom-package-lit';
import 'my-cstom-package-lit'
@Component({
  selector: 'cometchat-add-members-demo',
  templateUrl: './add-members-demo.component.html',
  styleUrls: ['./add-members-demo.component.scss']
})
export class AddMembersDemoComponent implements OnInit {



  constructor(private themeService:CometChatThemeService) {


  }

  ngOnInit(): void {
  }



}
