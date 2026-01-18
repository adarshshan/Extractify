import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousUploadsComponent } from './previous-uploads';

describe('PreviousUploads', () => {
  let component: PreviousUploadsComponent;
  let fixture: ComponentFixture<PreviousUploadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviousUploadsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviousUploadsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
