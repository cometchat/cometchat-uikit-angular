import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NAVIGATION_MENU_ACTIONS } from '../string_constants';

@Component({
  selector: 'cometchat-bottom-navigation',
  templateUrl: './bottom-navigation.component.html',
  styleUrls: ['./bottom-navigation.component.scss']
})
export class BottomNavigationComponent implements OnInit {


  selectedTab = 'conversation';
  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object }>();
  constructor() {

  }
  selectTab = (item) => {
    this.selectedTab = item;
    this.actionPerformed.emit({ action: NAVIGATION_MENU_ACTIONS.TAB_CHANGED, payload: { item } });
  }
  ngOnInit() {
  }

}
