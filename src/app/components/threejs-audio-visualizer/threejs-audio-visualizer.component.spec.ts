import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreejsAudioVisualizerComponent } from './threejs-audio-visualizer.component';

describe('ThreejsAudioVisualizerComponent', () => {
  let component: ThreejsAudioVisualizerComponent;
  let fixture: ComponentFixture<ThreejsAudioVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreejsAudioVisualizerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreejsAudioVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
