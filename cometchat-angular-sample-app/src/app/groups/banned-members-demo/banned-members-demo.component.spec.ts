import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannedMembersDemoComponent } from './banned-members-demo.component';

describe('BannedMembersDemoComponent', () => {
  let component: BannedMembersDemoComponent;
  let fixture: ComponentFixture<BannedMembersDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BannedMembersDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BannedMembersDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
