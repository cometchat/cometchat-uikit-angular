import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatImageViewerComponent } from "./cometchat-image-viewer.component";

describe("ImageViewComponent", () => {
  let component: CometChatImageViewerComponent;
  let fixture: ComponentFixture<CometChatImageViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatImageViewerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatImageViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
