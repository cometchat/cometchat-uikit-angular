import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoBubbleDemoComponent } from './video-bubble-demo.component';

describe('VideoBubbleDemoComponent', () => {
  let component: VideoBubbleDemoComponent;
  let fixture: ComponentFixture<VideoBubbleDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoBubbleDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoBubbleDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
