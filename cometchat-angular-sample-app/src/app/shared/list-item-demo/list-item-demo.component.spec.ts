import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemDemoComponent } from './list-item-demo.component';

describe('ListItemDemoComponent', () => {
  let component: ListItemDemoComponent;
  let fixture: ComponentFixture<ListItemDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListItemDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListItemDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
