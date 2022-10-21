import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcludeMessageOptionsComponent } from './exclude-message-options.component';

describe('ExcludeMessageOptionsComponent', () => {
  let component: ExcludeMessageOptionsComponent;
  let fixture: ComponentFixture<ExcludeMessageOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExcludeMessageOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExcludeMessageOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
