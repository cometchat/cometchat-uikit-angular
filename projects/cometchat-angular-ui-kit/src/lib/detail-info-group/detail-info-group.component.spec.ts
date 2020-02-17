import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailInfoGroupComponent } from './detail-info-group.component';

describe('DetailInfoGroupComponent', () => {
  let component: DetailInfoGroupComponent;
  let fixture: ComponentFixture<DetailInfoGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailInfoGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailInfoGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
