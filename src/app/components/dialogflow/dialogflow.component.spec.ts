import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogflowComponent } from './dialogflow.component';

describe('DialogflowComponent', () => {
  let component: DialogflowComponent;
  let fixture: ComponentFixture<DialogflowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogflowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
