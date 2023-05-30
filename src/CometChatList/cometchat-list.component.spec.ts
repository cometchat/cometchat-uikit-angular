import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometchatListComponent } from './cometchat-list.component';

describe('CometchatListComponent', () => {
  let component: CometchatListComponent;
  let fixture: ComponentFixture<CometchatListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometchatListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometchatListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should update the searchText property when searchEvent method is called', () => {
    const searchText = 'test';
    component.searchEvent({detail: {searchText}});
    expect(component.searchText).toBe(searchText);
  });
});
