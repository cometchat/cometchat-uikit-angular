import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageListDemoComponent } from './message-list-demo.component';

describe('MessageListDemoComponent', () => {
  let component: MessageListDemoComponent;
  let fixture: ComponentFixture<MessageListDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageListDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageListDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
