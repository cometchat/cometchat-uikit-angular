import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextBubbleDemoComponent } from './text-bubble-demo.component';

describe('TextBubbleDemoComponent', () => {
  let component: TextBubbleDemoComponent;
  let fixture: ComponentFixture<TextBubbleDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextBubbleDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextBubbleDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
