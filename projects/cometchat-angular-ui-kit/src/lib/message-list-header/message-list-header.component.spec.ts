import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageListHeaderComponent } from './message-list-header.component';

describe('MessageListHeaderComponent', () => {
  let component: MessageListHeaderComponent;
  let fixture: ComponentFixture<MessageListHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessageListHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageListHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
