import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGridComponent } from './create-grid.component';

describe('CreateGridComponent', () => {
  let component: CreateGridComponent;
  let fixture: ComponentFixture<CreateGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
