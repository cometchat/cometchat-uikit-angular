import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsDemoComponent } from './details-demo.component';

describe('DetailsDemoComponent', () => {
  let component: DetailsDemoComponent;
  let fixture: ComponentFixture<DetailsDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
