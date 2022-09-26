import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatDateComponent } from "./cometchat-date.component";
describe("MenuItemComponent", () => {
  let component: CometChatDateComponent;
  let fixture: ComponentFixture<CometChatDateComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatDateComponent],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
