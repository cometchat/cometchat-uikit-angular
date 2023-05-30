import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileBubbleDemoComponent } from './file-bubble-demo.component';

describe('FileBubbleDemoComponent', () => {
  let component: FileBubbleDemoComponent;
  let fixture: ComponentFixture<FileBubbleDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileBubbleDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileBubbleDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
