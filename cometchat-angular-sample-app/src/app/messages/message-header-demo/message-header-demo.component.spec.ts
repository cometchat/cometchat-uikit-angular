import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageHeaderDemoComponent } from './message-header-demo.component';

describe('MessageHeaderDemoComponent', () => {
  let component: MessageHeaderDemoComponent;
  let fixture: ComponentFixture<MessageHeaderDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageHeaderDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageHeaderDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
