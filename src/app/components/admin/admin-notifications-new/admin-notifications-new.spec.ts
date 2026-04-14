import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNotificationsNew } from './admin-notifications-new';

describe('AdminNotificationsNew', () => {
  let component: AdminNotificationsNew;
  let fixture: ComponentFixture<AdminNotificationsNew>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNotificationsNew]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNotificationsNew);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
