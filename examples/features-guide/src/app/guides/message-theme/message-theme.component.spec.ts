import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageThemeComponent } from './message-theme.component';

describe('MessageThemeComponent', () => {
  let component: MessageThemeComponent;
  let fixture: ComponentFixture<MessageThemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageThemeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
