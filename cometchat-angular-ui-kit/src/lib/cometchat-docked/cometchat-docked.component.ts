import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'cometchat-docked',
  templateUrl: './cometchat-docked.component.html',
  styleUrls: ['./cometchat-docked.component.scss']
})
export class CometchatDockedComponent {

  title = 'angular-CometChat-pro';
  user?: object;
  json = JSON;
  group?: object;
  constructor(private cdRef: ChangeDetectorRef) { }

  onItemSelected = (item, type) => {
    if (type === 'group') {
      this.group = item;
      this.user = undefined;
    } else {
      this.user = item;
      this.group = undefined;
    }
    this.cdRef.detectChanges();
  }
}
