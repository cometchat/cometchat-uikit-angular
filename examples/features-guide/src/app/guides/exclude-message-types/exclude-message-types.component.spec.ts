import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcludeMessageTypesComponent } from './exclude-message-types.component';

describe('ExcludeMessageTypesComponent', () => {
  let component: ExcludeMessageTypesComponent;
  let fixture: ComponentFixture<ExcludeMessageTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExcludeMessageTypesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExcludeMessageTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
