import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwarmComponent } from './swarm.component';

describe('SwarmComponent', () => {
  let component: SwarmComponent;
  let fixture: ComponentFixture<SwarmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwarmComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwarmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
