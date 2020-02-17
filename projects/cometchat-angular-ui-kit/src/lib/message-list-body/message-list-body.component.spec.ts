import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageListBodyComponent } from './message-list-body.component';

describe('MessageListBodyComponent', () => {
  let component: MessageListBodyComponent;
  let fixture: ComponentFixture<MessageListBodyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessageListBodyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageListBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
