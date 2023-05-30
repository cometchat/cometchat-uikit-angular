import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoundManagerDemoComponent } from './sound-manager-demo.component';

describe('SoundManagerDemoComponent', () => {
  let component: SoundManagerDemoComponent;
  let fixture: ComponentFixture<SoundManagerDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoundManagerDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoundManagerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
