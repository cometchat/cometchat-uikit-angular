import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageListFooterComponent } from './message-list-footer.component';

describe('MessageListFooterComponent', () => {
  let component: MessageListFooterComponent;
  let fixture: ComponentFixture<MessageListFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessageListFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageListFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
