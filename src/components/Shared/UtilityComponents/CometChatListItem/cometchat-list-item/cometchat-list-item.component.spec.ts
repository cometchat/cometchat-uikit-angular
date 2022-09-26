import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatListItemComponent } from "./cometchat-list-item.component";
describe("ListItemComponent", () => {
  let component: CometChatListItemComponent;
  let fixture: ComponentFixture<CometChatListItemComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatListItemComponent],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
