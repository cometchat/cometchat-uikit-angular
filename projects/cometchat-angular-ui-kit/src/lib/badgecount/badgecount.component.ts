import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'badgecount',
  templateUrl: './badgecount.component.html',
  styleUrls: ['./badgecount.component.scss']
})
export class BadgecountComponent implements OnInit {
  @Input() count = 0;
  constructor() { }

  ngOnInit() {
  }

}
