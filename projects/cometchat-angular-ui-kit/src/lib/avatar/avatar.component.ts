import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})

export class AvatarComponent implements OnInit {

  @Input() image: string = 'https://data-us.cometchat.io/assets/images/avatars/captainamerica.png';
  @Input() name: string;
  @Input() cornerRadius?: string;
  @Input() borderWidth?: string;
  @Input() borderColor?: string;

  bgColor;
  constructor() { }

  ngOnInit() {
    console.log(this.image, "avatar");
    let color = Math.floor(0x1000000 * Math.random()).toString(16);
    this.bgColor = '#' + ('000000' + color).slice(-6);
  }

  getMyStyle = () => {
    return {
      border:
        (this.borderWidth ? this.borderWidth : '1px') + ' solid ' + (this.borderColor ? this.borderColor : '#AAA'),
      'border-radius': this.cornerRadius ? this.cornerRadius : '0px'
    }
  }

  getRandomColor() {
    return this.bgColor;
  }




}
