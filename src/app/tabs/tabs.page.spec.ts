import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsPage],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the ALGEXYZ tab icons', () => {
    const element: HTMLElement = fixture.nativeElement;
    const icons = [...element.querySelectorAll('ion-icon')].map((icon) => icon.getAttribute('src'));

    expect(icons).toEqual([
      'assets/icons/tab-converter.svg',
      'assets/icons/tab-calculator.svg',
      'assets/icons/tab-practice.svg',
    ]);
  });
});
