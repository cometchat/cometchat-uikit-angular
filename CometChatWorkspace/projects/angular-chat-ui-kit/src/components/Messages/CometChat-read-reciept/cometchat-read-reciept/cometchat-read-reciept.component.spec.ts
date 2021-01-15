import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReadRecieptComponent } from "./cometchat-read-reciept.component";

describe("ReadRecieptComponent", () => {
  let component: CometChatReadRecieptComponent;
  let fixture: ComponentFixture<CometChatReadRecieptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReadRecieptComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatReadRecieptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
