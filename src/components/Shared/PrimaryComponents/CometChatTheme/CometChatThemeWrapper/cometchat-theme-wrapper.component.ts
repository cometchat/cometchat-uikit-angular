import { Component, forwardRef, Input, OnChanges, OnInit, } from '@angular/core';
import { Breakpoints, CometChatTheme } from '../CometChatTheme';
@Component({
  selector: 'cometchat-theme-wrapper',
  templateUrl: './cometchat-theme-wrapper.component.html',
  styleUrls: ['./cometchat-theme-wrapper.component.scss'],
  // 
})
export class CometChatWrapperComponent implements OnInit, OnChanges {
  defaultTheme = new CometChatTheme({});
  @Input() theme: any = null;
  static cometchattheme:any = null;
  constructor() { }
  ngOnChanges() {
    if (this.theme && this.theme.palette?.mode != CometChatWrapperComponent?.cometchattheme?.palette?.mode) {
      this.setTheme()
    }

  }
  ngDoCheck(){
 
  }
  ngOnInit() {
  }
  setTheme(){
    if (this.theme && this.theme.palette) {
        if (this.theme.palette.hasOwnProperty("mode")) {
          this.defaultTheme.palette.setMode(this.theme.palette.mode);
        }
        if (this.theme.palette.hasOwnProperty("background")) {
          this.defaultTheme.palette.setBackground(this.theme.palette.background);
        }
        if (this.theme.palette.hasOwnProperty("primary")) {
          this.defaultTheme.palette.setPrimary(this.theme.palette.primary);
        }
        if (this.theme.palette.hasOwnProperty("error")) {
          this.defaultTheme.palette.setError(this.theme.palette.error);
        }
        if (this.theme.palette.hasOwnProperty("accent")) {
          this.defaultTheme.palette.setAccent(this.theme.palette.accent);
        }
        if (this.theme.palette.hasOwnProperty("accent50")) {
          this.defaultTheme.palette.setAccent50(this.theme.palette.accent50);
        }
        if (this.theme.palette.hasOwnProperty("accent100")) {
          this.defaultTheme.palette.setAccent100(this.theme.palette.accent100);
        }
        if (this.theme.palette.hasOwnProperty("accent200")) {
          this.defaultTheme.palette.setAccent200(this.theme.palette.accent200);
        }
        if (this.theme.palette.hasOwnProperty("accent300")) {
          this.defaultTheme.palette.setAccent300(this.theme.palette.accent300);
        }
        if (this.theme.palette.hasOwnProperty("accent400")) {
          this.defaultTheme.palette.setAccent400(this.theme.palette.accent400);
        }
        if (this.theme.palette.hasOwnProperty("accent500")) {
          this.defaultTheme.palette.setAccent500(this.theme.palette.accent500);
        }
        if (this.theme.palette.hasOwnProperty("accent600")) {
          this.defaultTheme.palette.setAccent600(this.theme.palette.accent600);
        }
        if (this.theme.palette.hasOwnProperty("accent700")) {
          this.defaultTheme.palette.setAccent700(this.theme.palette.accent700);
        }
        if (this.theme.palette.hasOwnProperty("accent800")) {
          this.defaultTheme.palette.setAccent800(this.theme.palette.accent800);
        }
        if (this.theme.palette.hasOwnProperty("accent900")) {
          this.defaultTheme.palette.setAccent900(this.theme.palette.accent900);
        }
        if (this.theme.palette.hasOwnProperty("secondary")) {
          this.defaultTheme.palette.getSecondary(this.theme.palette.secondary);
        }
      } 
      if (this.theme && this.theme.typography) {
        if (this.theme.typography.hasOwnProperty("fontFamily")) {
          this.defaultTheme.typography.setFontFamily(this.theme.typography.fontFamily);
          this.defaultTheme.typography.setHeading({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setName({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setTitle1({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setTitle2({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setSubtitle1({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setSubtitle2({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setText1({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setText2({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setCaption1({fontFamily:this.theme.typography.fontFamily})
          this.defaultTheme.typography.setCaption2({fontFamily:this.theme.typography.fontFamily})
          // setTimeout(() => {
          // }, 2000);
        }
        if (this.theme.typography.hasOwnProperty("fontWeightRegular")) {
          this.defaultTheme.typography.setFontWeightRegular(this.theme.typography.fontWeightRegular);
        }
        if (this.theme.typography.hasOwnProperty("fontWeightMedium")) {
          this.defaultTheme.typography.setFontWeightMedium(this.theme.typography.fontWeightMedium);
        }
        if (this.theme.typography.hasOwnProperty("fontWeightSemibold")) {
          this.defaultTheme.typography.setFontWeightSemibold(this.theme.typography.fontWeightSemibold);
        }
        if (this.theme.typography.hasOwnProperty("fontWeightBold")) {
          this.defaultTheme.typography.setFontWeightBold(this.theme.typography.fontWeightBold);
        }
        if (this.theme.typography.hasOwnProperty("heading")) {
          this.defaultTheme.typography.setHeading(this.theme.typography.heading);
        }
        if (this.theme.typography.hasOwnProperty("name")) {
          this.defaultTheme.typography.setName(this.theme.typography.name);
        }
        if (this.theme.typography.hasOwnProperty("title1")) {
          this.defaultTheme.typography.setTitle1(this.theme.typography.title1);
        }
        if (this.theme.typography.hasOwnProperty("title2")) {
          this.defaultTheme.typography.setTitle2(this.theme.typography.title2);
        }
        if (this.theme.typography.hasOwnProperty("subtitle1")) {
          this.defaultTheme.typography.setSubtitle1(this.theme.typography.subtitle1);
        }
        if (this.theme.typography.hasOwnProperty("subtitle2")) {
          this.defaultTheme.typography.setSubtitle2(this.theme.typography.subtitle2);
        }
        if (this.theme.typography.hasOwnProperty("text1")) {
          this.defaultTheme.typography.setText1(this.theme.typography.text1);
        }
        if (this.theme.typography.hasOwnProperty("text2")) {
          this.defaultTheme.typography.setText2(this.theme.typography.text2);
        }
        if (this.theme.typography.hasOwnProperty("caption1")) {
          this.defaultTheme.typography.setCaption1(this.theme.typography.caption1);
        }
        if (this.theme.typography.hasOwnProperty("caption2")) {
          this.defaultTheme.typography.setCaption2(this.theme.typography.caption2);
        }
      }
      if (this.theme && this.theme.globalStyles && Object.keys(this.theme.globalStyles).length) {
        this.defaultTheme.globalStyles = { ...this.theme.globalStyles };
      }
      if (this.theme && this.theme.breakpoints && this.theme.breakpoints.values && Object.keys(this.theme.breakpoints.values).length) {
        this.defaultTheme.breakpoints = new Breakpoints();
        this.defaultTheme.breakpoints.setValues({ ...this.theme.breakpoints.values });
      }
      CometChatWrapperComponent.cometchattheme = {...this.defaultTheme}
}
}
