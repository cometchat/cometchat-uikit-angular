import { Component, ElementRef, Input, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { SearchInputStyle } from 'my-cstom-package-lit';
import { ListStyle,MessageListStyle, States, TitleAlignment, UsersStyle } from 'uikit-utils-lerna';
import { localize } from 'uikit-resources-lerna';
@Component({
  selector: 'cometchat-list',
  templateUrl: './cometchat-list.component.html',
  styleUrls: ['./cometchat-list.component.scss']
})
export class CometchatListComponent implements OnInit {
  @ViewChild("listScroll", { static: false }) listScroll!: ElementRef;
  @ViewChild("bottom", { static: false }) bottom!: ElementRef;
  @ViewChild("top", { static: false }) top!: ElementRef;
  @Input() listItemView!: TemplateRef<any>; //custom view
  @Input() onScrolledToBottom!: ()=>void;
  @Input() onScrolledToTop!: ()=>void;
  @Input() list: any = [];
  @Input() onSearch!: (text:string)=>void;
  @Input() searchText: string = localize("SEARCH");
  @Input() searchIconURL: String = "assets/search.svg";
  @Input() listStyle: ListStyle = {
    height: "100%",
    width: "100%",
 }
  @Input() searchPlaceholderText: String = "";
  @Input() hideSearch: boolean = false;
  @Input() hideError: boolean = false;
  @Input() title: string = "";
  @Input() titleAlignment: TitleAlignment = TitleAlignment.left;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() state: States = States.loaded;
  @Input() errorStateText: string = "";
  @Input() emptyStateText: string = "";
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() showSectionHeader: boolean = false;
  @Input() sectionHeaderField: string = "name";
  public states: typeof States = States
  public numberOfTopScroll: number = 0;
  searchStyle: SearchInputStyle = {

  }
  iconStyle:any = {}
  constructor() {

  }
  ngOnInit(): void {
    this.iconStyle =  this.listStyle.loadingIconTint
    this.searchStyle.searchTextFont = this.listStyle?.searchTextFont,
    this.searchStyle.searchTextColor = this.listStyle?.searchTextColor,
    this.searchStyle.placeholderTextFont = this.listStyle?.searchPlaceholderTextFont,
    this.searchStyle.placeholderTextColor = this.listStyle?.searchPlaceholderTextColor,
    this.searchStyle.searchIconTint = this.listStyle?.searchIconTint
    this.searchStyle.background = this.listStyle?.searchBackground,
    this.searchStyle.borderRadius = this.listStyle.searchBorderRadius
    this.searchStyle.border = this.listStyle.searchBorder


   }
   ngAfterViewInit(){
    this.ioBottom();
   }
  ngOnChanges(changes: SimpleChanges): void {
  }
  /**
   * listening to bottom scroll using intersection observer
   */
  ioBottom = () => {
    const options = {
      root: this.listScroll.nativeElement,
      rootMargin: '-100% 0px 100px 0px',
      threshold: 0
    }
    const callback = (entries: any) => {
      if (entries[0].isIntersecting && this.onScrolledToBottom && this.list?.length > 0) {
        this.onScrolledToBottom()
      }
    }
    var observer: IntersectionObserver = new IntersectionObserver(callback, options);
    observer.observe(this.bottom.nativeElement);
  }
  /**
 * listening to top scroll using intersection observer
 */
  ioTop = () => {
    const options = {
      root: this.listScroll.nativeElement,
      rootMargin: '200px 0px 0px 0px',
      threshold: 1.0
    }
    const callback = (entries: any) => {
      if (entries[0].isIntersecting) {
        this.numberOfTopScroll++
        if (this.onScrolledToTop && this.numberOfTopScroll > 1) {
          this.onScrolledToTop()
        }
      }
    }
    var observer: IntersectionObserver = new IntersectionObserver(callback, options);
    observer.observe(this.top.nativeElement);
  }
  searchEvent = (event: any) => {
    this.searchText = event?.detail?.searchText;
    if (this.onSearch) {
      this.onSearch(this.searchText)
    }
  }
   /**
 * styling part
 */
  chatsListStyle = () => {
    return {
      height: this.listStyle.height,
      background: this.listStyle.background,
    };
  }
  messageContainerStyle = () => {
    return {
      width: this.listStyle.width,
    };
  }
  errorStyle = () => {
    return {
      textFont: this.listStyle.errorStateTextFont,
      textColor: this.listStyle.errorStateTextColor,
    }
  }
  emptyStyle = () => {
    return {
      textFont: this.listStyle.emptyStateTextFont,
      textColor: this.listStyle.emptyStateTextColor,
    }
  }
  wrapperStyle = () => {
    return {
      height: this.listStyle.height,
      width: this.listStyle.width,
      background: this.listStyle.background,
      border: this.listStyle.border,
      borderRadius: this.listStyle.borderRadius
    }
  }
  headerTitle = () => {
    let postiton: any = this.titleAlignment == TitleAlignment.left ? { textAlign: "left" } : { textAlign: "center" }
    return {
      font: this.listStyle.titleTextFont,
      color: this.listStyle.titleTextColor,
      ...postiton
    }
  }
  sectionHeaderStyle = () => {
    return {
      font: this.listStyle?.sectionHeaderTextFont,
      color: this.listStyle?.sectionHeaderTextColor,
    }
  }
  headerStyle = ()=>{
    return {
      height: "fit-content",
      marginBottom:"12px"
    }
  }
  listStyles = ()=>{
    return {
      height: "100%"
    }
  }
}
