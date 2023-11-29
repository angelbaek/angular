import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionComponentComponent } from './session-component.component';

describe('SessionComponentComponent', () => {
  let component: SessionComponentComponent;
  let fixture: ComponentFixture<SessionComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SessionComponentComponent]
    });
    fixture = TestBed.createComponent(SessionComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
