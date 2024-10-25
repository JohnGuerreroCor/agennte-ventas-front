import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenteVozComponent } from './asistente-voz.component';

describe('AsistenteVozComponent', () => {
  let component: AsistenteVozComponent;
  let fixture: ComponentFixture<AsistenteVozComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AsistenteVozComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsistenteVozComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
