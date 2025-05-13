import { TestBed } from '@angular/core/testing';

import { CharacService } from './charac.service';

describe('CharacService', () => {
  let service: CharacService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
