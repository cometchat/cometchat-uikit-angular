import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'status-indicator',
  templateUrl: './status-indicator.component.html',
  styleUrls: ['./status-indicator.component.scss']
})
export class StatusIndicatorComponent implements OnInit {

  @Input() cornerRadius: string;
  @Input() borderWidth: string;
  @Input() borderColor: string;
  @Input() color: string;
  @Input() status: string = 'offline';
  @Input() width: string;
  @Input() height: string;
  @Input() background: string;
  constructor() { }

  ngOnInit() {
  }

  getMyStyle = () => {

    return {
      border:
        this.borderWidth + ' solid ' + this.borderColor + ' ' + this.borderColor,
      width: this.width, height: this.height, background: this.background, 'border-radius': this.cornerRadius
    };
  }
}