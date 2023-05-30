import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatTransferOwnershipComponent } from "./cometchat-transfer-ownership.component";

describe("CometChatTransferOwnershipComponent", () => {
  let component: CometChatTransferOwnershipComponent;
  let fixture: ComponentFixture<CometChatTransferOwnershipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatTransferOwnershipComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatTransferOwnershipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
