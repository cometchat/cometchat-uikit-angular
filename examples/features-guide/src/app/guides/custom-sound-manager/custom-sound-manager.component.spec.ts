import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSoundManagerComponent } from './custom-sound-manager.component';

describe('CustomSoundManagerComponent', () => {
  let component: CustomSoundManagerComponent;
  let fixture: ComponentFixture<CustomSoundManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomSoundManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomSoundManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
