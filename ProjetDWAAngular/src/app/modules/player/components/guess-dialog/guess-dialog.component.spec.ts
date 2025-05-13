import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuessDialogComponent } from './guess-dialog.component';

describe('GuessDialogComponent', () => {
  let component: GuessDialogComponent;
  let fixture: ComponentFixture<GuessDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuessDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
