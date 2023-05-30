import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesDemoComponent } from './messages-demo.component';

describe('MessagesDemoComponent', () => {
  let component: MessagesDemoComponent;
  let fixture: ComponentFixture<MessagesDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessagesDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
