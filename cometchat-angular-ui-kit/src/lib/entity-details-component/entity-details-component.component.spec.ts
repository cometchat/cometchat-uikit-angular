import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityDetailsComponentComponent } from './entity-details-component.component';

describe('EntityDetailsComponentComponent', () => {
  let component: EntityDetailsComponentComponent;
  let fixture: ComponentFixture<EntityDetailsComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntityDetailsComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityDetailsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
