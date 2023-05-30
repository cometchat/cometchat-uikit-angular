import { Component, OnInit, Input, TemplateRef, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CometChatTabItem, TabAlignment } from 'uikit-resources-lerna';
import { BaseStyle } from 'uikit-utils-lerna';
import 'my-cstom-package-lit'
import { CometChat } from '@cometchat-pro/chat';
import * as fs from 'fs';
@Component({
  selector: 'cometchat-tabs',
  templateUrl: './cometchat-tabs.component.html',
  styleUrls: ['./cometchat-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatTabsComponent implements OnInit {
  @Input() tabAlignment:TabAlignment = TabAlignment.bottom;
  @Input()  tabsStyle:BaseStyle = {}
  @Input() tabs:CometChatTabItem[] = [];
  public activeTab!:CometChatTabItem;
  public childView!:TemplateRef<any> | null;
  constructor(private ref:ChangeDetectorRef){}
  openViewOnCLick = (tabItem:CometChatTabItem)=>{

    this.childView = null;
    let index = this.tabs.findIndex((item: CometChatTabItem) => item.id === tabItem.id);
                if (index > -1) {
                  this.activeTab = tabItem
                    this.childView =  this.tabs[index].childView
                    this.ref.detectChanges()
                }
  }
  ngOnInit(): void {
  }
   getButtonStyle(tab: CometChatTabItem) {
    const { style = {} } = tab || {};
    const { id } = this.activeTab || {};
    const active = id === tab?.id;

    return {
      background: active ? style.activeBackground ?? style.background : style.background,
      buttonTextFont: active ? style.activeTitleTextFont ?? style.titleTextFont : style.titleTextFont,
      buttonTextColor: active ? style.activeTitleTextColor ?? style.titleTextColor : style.titleTextColor,
      buttonIconTint: active ? style.activeIconTint ?? style.iconTint : style.iconTint,
      height: style.height,
      width: style.width,
      border: style.border,
      borderRadius: style.borderRadius,
      gap: "0",
      padding: "0",
    };
  }

   getTabsStyle() {
    const position = (() => {
      switch (this.tabAlignment) {
        case TabAlignment.top:
        case TabAlignment.left:
          return {
            top: "0",
            left: "0",
          };
        case TabAlignment.bottom:
          return {
            bottom: "0",
            left: "0",
          };
        default:
          return {
            top: "0",
            right: "0",
          };
      }
    })();

    const { background } = this.tabsStyle ?? {};

    return {
      background,
      ...position,
    };
  }

  getTabsPlacement(){
    let alignment:string = this.tabAlignment == TabAlignment.top || this.tabAlignment == TabAlignment.bottom ? "row" : "column"
    return {
      display:"flex",
      flexDirection: alignment
    }
  }
}

