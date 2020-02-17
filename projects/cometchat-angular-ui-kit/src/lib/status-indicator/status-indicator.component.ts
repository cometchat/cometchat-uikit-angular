import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'status-indicator',
  templateUrl: './status-indicator.component.html',
  styleUrls: ['./status-indicator.component.scss']
})
export class StatusIndicatorComponent implements OnInit {

  @Input() cornerRadius = '50%';
  @Input() borderWidth = '2px';
  @Input() borderColor = '#EEE';
  @Input() color = '#00FF00';
  @Input() status = '';

  constructor() { }

  ngOnInit() {
  }

  getMyStyle = () => {
    if (this.status === 'offline') {
      return {
        border:
          (this.borderWidth ? this.borderWidth : '1px') + ' solid ' + (this.borderColor ? this.borderColor : '#AAA'),
        width: '15px', height: '15px', background: '#555', 'border-radius': this.cornerRadius
      };
    } else {
      return {
        border:
          (this.borderWidth ? this.borderWidth : '1px') + ' solid ' + (this.borderColor ? this.borderColor : '#AAA'),
        width: '15px', height: '15px', background: this.color, 'border-radius': this.cornerRadius
      };
    }

  }
}
