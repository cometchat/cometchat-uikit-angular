import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatGroupsComponent } from "./cometchat-groups.component";

describe("CometChatGroupsComponent", () => {
  let component: CometChatGroupsComponent;
  let fixture: ComponentFixture<CometChatGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatGroupsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
