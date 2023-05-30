import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioBubbleDemoComponent } from './audio-bubble-demo.component';

describe('AudioBubbleDemoComponent', () => {
  let component: AudioBubbleDemoComponent;
  let fixture: ComponentFixture<AudioBubbleDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AudioBubbleDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioBubbleDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
