import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatMenuListComponent } from "./cometchat-menu-list.component";
describe("MenuComponent", () => {
  let component: CometChatMenuListComponent;
  let fixture: ComponentFixture<CometChatMenuListComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMenuListComponent],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMenuListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
