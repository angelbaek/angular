import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeovizGraphComponent } from './neoviz-graph.component';

describe('NeovizGraphComponent', () => {
  let component: NeovizGraphComponent;
  let fixture: ComponentFixture<NeovizGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NeovizGraphComponent]
    });
    fixture = TestBed.createComponent(NeovizGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
