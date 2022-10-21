import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatDecoratorMessageComponent } from './cometchat-decorator-message.component';

describe('CometChatDecoratorMessageComponent', () => {
  let component: CometChatDecoratorMessageComponent;
  let fixture: ComponentFixture<CometChatDecoratorMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatDecoratorMessageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDecoratorMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
