import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularChatUiKitComponent } from './angular-chat-ui-kit.component';

describe('AngularChatUiKitComponent', () => {
  let component: AngularChatUiKitComponent;
  let fixture: ComponentFixture<AngularChatUiKitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AngularChatUiKitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularChatUiKitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
