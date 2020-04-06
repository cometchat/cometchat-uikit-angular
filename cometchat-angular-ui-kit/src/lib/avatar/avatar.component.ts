import { Component, OnInit, Input, ChangeDetectorRef, OnChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
// import Avatars from '@dicebear/avatars';
// import sprites from '@dicebear/avatars-human-sprites';


@Component({
  selector: 'cometchat-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnChanges {
  @Input() image: any;
  @Input() cornerRadius?: any;
  @Input() borderWidth?: any;
  @Input() borderColor?: any;
  constructor(private sanitizer: DomSanitizer, private cdRef: ChangeDetectorRef) { }

  ngOnChanges() {
    this.image = this.sanitizer.bypassSecurityTrustResourceUrl(this.image);
  }

  getMyStyle = () => {
    return {
      border:
        (this.borderWidth ? this.borderWidth : '1px') + ' solid ' + (this.borderColor ? this.borderColor : '#AAA'),
      'border-radius': this.cornerRadius ? this.cornerRadius : '50%'
    };
  }
}
