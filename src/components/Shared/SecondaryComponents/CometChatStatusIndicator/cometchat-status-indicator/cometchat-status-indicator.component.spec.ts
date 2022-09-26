import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatStatusIndicatorComponent } from "./cometchat-status-indicator.component";
describe("StatusIndicatorComponent", () => {
  let component: CometChatStatusIndicatorComponent;
  let fixture: ComponentFixture<CometChatStatusIndicatorComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatStatusIndicatorComponent],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatStatusIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
