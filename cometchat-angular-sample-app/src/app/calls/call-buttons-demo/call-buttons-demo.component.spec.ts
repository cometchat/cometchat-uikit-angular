import {  ComponentFixture, TestBed } from "@angular/core/testing";
import { CallButtonsDemoComponent } from "./call-buttons-demo.component";

describe("CallButtonsDemoComponent", () => {
  let component: CallButtonsDemoComponent;
  let fixture: ComponentFixture<CallButtonsDemoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CallButtonsDemoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CallButtonsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
