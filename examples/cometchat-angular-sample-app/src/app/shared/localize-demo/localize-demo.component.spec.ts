import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalizeDemoComponent } from './localize-demo.component';

describe('LocalizeDemoComponent', () => {
  let component: LocalizeDemoComponent;
  let fixture: ComponentFixture<LocalizeDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocalizeDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalizeDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
