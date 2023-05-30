import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageBubbleDemoComponent } from './image-bubble-demo.component';

describe('ImageBubbleDemoComponent', () => {
  let component: ImageBubbleDemoComponent;
  let fixture: ComponentFixture<ImageBubbleDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageBubbleDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageBubbleDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
