import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @Input() searchModel;
  @Output() searchModelChange: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  updateSearchModel(value) {
    console.log('I am being updated');
    this.searchModel = value;
    this.searchModelChange.emit(this.searchModel);
  }

}


