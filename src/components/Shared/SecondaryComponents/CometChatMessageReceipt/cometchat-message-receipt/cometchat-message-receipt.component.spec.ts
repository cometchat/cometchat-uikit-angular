import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatMessageReceiptComponent } from './cometchat-message-receipt.component'
describe("MessageReceiptComponent", () => {
  let component: CometChatMessageReceiptComponent;
  let fixture: ComponentFixture<CometChatMessageReceiptComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMessageReceiptComponent],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
