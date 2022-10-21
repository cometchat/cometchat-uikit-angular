import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageAlignmentComponent } from './message-alignment.component';

describe('MessageAlignmentComponent', () => {
  let component: MessageAlignmentComponent;
  let fixture: ComponentFixture<MessageAlignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageAlignmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageAlignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
