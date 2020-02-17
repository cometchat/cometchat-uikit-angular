import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {

  @Output() menuName = new EventEmitter<string>();

  // default active icon
  selectedItem: string = 'contactlist';

  constructor() { }

  ngOnInit() {
  }

  getTabName(data) {
    this.selectedItem = data;
    this.menuName.emit(this.selectedItem);
  }

}
