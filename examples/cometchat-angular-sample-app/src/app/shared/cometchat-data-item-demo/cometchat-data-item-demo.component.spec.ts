import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatDataItemDemoComponent } from './cometchat-data-item-demo.component';

describe('CometChatDataItemDemoComponent', () => {
  let component: CometChatDataItemDemoComponent;
  let fixture: ComponentFixture<CometChatDataItemDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatDataItemDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDataItemDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
