import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailInfoComponent } from './detail-info.component';

describe('DetailInfoComponent', () => {
  let component: DetailInfoComponent;
  let fixture: ComponentFixture<DetailInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
