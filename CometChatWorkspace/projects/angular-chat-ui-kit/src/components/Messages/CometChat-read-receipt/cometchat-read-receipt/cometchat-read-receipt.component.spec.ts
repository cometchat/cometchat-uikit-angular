import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReadReceiptComponent } from "./cometchat-read-receipt.component";

describe("ReadRecieptComponent", () => {
  let component: CometChatReadReceiptComponent;
  let fixture: ComponentFixture<CometChatReadReceiptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReadReceiptComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatReadReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
